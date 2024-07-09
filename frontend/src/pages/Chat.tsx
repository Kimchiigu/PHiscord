import React, { useEffect, useState, useRef } from 'react';
import { db, storage } from './firebaseConfig';
import { collection, addDoc, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc, getDoc, getDocs, limit, startAfter, where } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from './provider/AuthProvider';
import Message from './Message';
import MentionsList from './MentionsList';
import Filter from 'bad-words';

interface MessageData {
  id: string;
  user: string;
  message: string;
  timestamp: any;
  profilePicture: string;
  editedTimestamp?: any;
}

interface Member {
  id: string;
  displayName: string;
  profilePicture: string;
  serverNickname?: string;
}

const Chat: React.FC<{ serverID: string; channelID: string; channelName: string }> = ({ serverID, channelID, channelName }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [emojiTrayVisible, setEmojiTrayVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<{ id: string; visible: boolean }>({ id: '', visible: false });
  const [mentionList, setMentionList] = useState<Member[]>([]);
  const [mentionVisible, setMentionVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<MessageData[]>([]);
  const [lastVisible, setLastVisible] = useState<any>(null);
  const [currentUserNickname, setCurrentUserNickname] = useState<string | null>(null);
  const [nsfw, setNsfw] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const defaultProfilePicture = "https://cdn.discordapp.com/embed/avatars/0.png";
  const emojis = ['😀', '😂', '😍', '😎', '😭', '😡', '👍', '👎', '🙏', '💪'];

  const isImage = (url: string) => /(\.jpeg|\.jpg|\.gif|\.png)$/.test(url);
  const isVideo = (url: string) => /(\.mp4|\.webm|\.ogg)$/.test(url);

  useEffect(() => {
    if (!serverID || !channelID) {
      console.error('Server ID or Channel ID is not defined');
      return;
    }

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const channelDoc = await getDoc(doc(db, 'Servers', serverID, 'Channels', channelID));
        if (channelDoc.exists()) {
          setNsfw(channelDoc.data().nsfw);
        }

        const messagesCollection = collection(db, 'Servers', serverID, 'Channels', channelID, 'Messages');
        const messagesQuery = query(messagesCollection, orderBy('timestamp', 'desc'), limit(20));

        onSnapshot(messagesQuery, (snapshot) => {
          const filter = new Filter();
          console.log(nsfw)
          const messagesList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            message: nsfw ? doc.data().message : filter.clean(doc.data().message), 
            timestamp: doc.data().timestamp ? doc.data().timestamp.toDate() : new Date(),
            editedTimestamp: doc.data().editedTimestamp ? doc.data().editedTimestamp.toDate() : undefined
          })) as MessageData[];

          setMessages(messagesList.reverse());
          setLastVisible(snapshot.docs[snapshot.docs.length - 1]);
          setLoading(false);
          scrollToBottom();
        });
      } catch (error) {
        console.error('Error fetching messages:', error);
        setLoading(false);
      }
    };

    fetchMessages();
  }, [serverID, channelID, nsfw]);

  useEffect(() => {
    const fetchMentions = async () => {
      setLoading(true);
      const membersCollection = collection(db, 'Servers', serverID, 'Members');
      const memberSnapshot = await getDocs(membersCollection);
      const membersList: Member[] = [];

      for (const memberDoc of memberSnapshot.docs) {
        const memberData = memberDoc.data() as { userId: string; role: string };
        const userDoc = await getDoc(doc(db, 'Users', memberData.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const nicknameDoc = await getDocs(
            query(collection(db, 'Users', memberData.userId, 'Nicknames'), where('serverId', '==', serverID))
          );
          const nicknameData = nicknameDoc.docs[0]?.data();
          const member = {
            id: memberData.userId,
            displayName: userData.displayName,
            profilePicture: userData.profilePicture || defaultProfilePicture,
            serverNickname: nicknameData?.serverNickname
          };
          membersList.push(member);
        }
      }
      setMentionList(membersList);
      setLoading(false);
    };

    fetchMentions();
  }, [serverID]);

  useEffect(() => {
    const fetchCurrentUserNickname = async () => {
      if (currentUser) {
        const nicknameQuery = query(
          collection(db, 'Users', currentUser.uid, 'Nicknames'),
          where('serverId', '==', serverID)
        );
        const nicknameSnapshot = await getDocs(nicknameQuery);
        if (!nicknameSnapshot.empty) {
          const nicknameData = nicknameSnapshot.docs[0].data();
          setCurrentUserNickname(nicknameData.serverNickname || null);
        }
      }
    };

    fetchCurrentUserNickname();
  }, [currentUser, serverID]);

  const fetchOlderMessages = async () => {
    if (!lastVisible) return;

    setLoading(true);
    try {
      const messagesCollection = collection(db, 'Servers', serverID, 'Channels', channelID, 'Messages');
      const messagesQuery = query(
        messagesCollection,
        orderBy('timestamp', 'desc'),
        startAfter(lastVisible),
        limit(20)
      );

      const messageSnapshot = await getDocs(messagesQuery);
      const filter = new Filter();
      const olderMessages = messageSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        message: nsfw ? doc.data().message : filter.clean(doc.data().message), 
        timestamp: doc.data().timestamp ? doc.data().timestamp.toDate() : new Date(),
        editedTimestamp: doc.data().editedTimestamp ? doc.data().editedTimestamp.toDate() : undefined
      })) as MessageData[];

      setMessages(prevMessages => [...olderMessages.reverse(), ...prevMessages]);
      setLastVisible(messageSnapshot.docs[messageSnapshot.docs.length - 1]);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching older messages:', error);
      setLoading(false);
    }
  };

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (e.currentTarget.scrollTop === 0 && !loading) {
      fetchOlderMessages();
    }
  };

  const handleSendMessage = async () => {
    if (!serverID || !channelID) {
      console.error('Server ID or Channel ID is not defined');
      return;
    }

    if (newMessage.trim() === '' && !selectedFile) return;
    const messagesCollection = collection(db, 'Servers', serverID, 'Channels', channelID, 'Messages');
    const timestamp = new Date();
    let fileUrl = '';

    if (selectedFile) {
      const fileRef = ref(storage, `files/${serverID}/${channelID}/${selectedFile.name}`);
      await uploadBytes(fileRef, selectedFile);
      fileUrl = await getDownloadURL(fileRef);
    }

    // Fetch server nickname
    let serverNickname = currentUser?.displayName || 'Anonymous';
    if (currentUser) {
      const nicknameQuery = query(
        collection(db, 'Users', currentUser.uid, 'Nicknames'),
        where('serverId', '==', serverID)
      );
      const nicknameSnapshot = await getDocs(nicknameQuery);
      if (!nicknameSnapshot.empty) {
        const nicknameData = nicknameSnapshot.docs[0].data();
        serverNickname = nicknameData.serverNickname || serverNickname;
      }
    }

    await addDoc(messagesCollection, {
      user: serverNickname,
      message: fileUrl || newMessage,
      timestamp,
      profilePicture: currentUser?.profilePicture || defaultProfilePicture,
    });

    setNewMessage('');
    setSelectedFile(null);
    setFilePreview(null);
    scrollToBottom();
  };

  const handleSelectEmoji = (emoji: string) => {
    setNewMessage(newMessage + emoji);
    setEmojiTrayVisible(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCancelUpload = () => {
    setSelectedFile(null);
    setFilePreview(null);
  };

  const handleEditMessage = async (id: string, newMessage: string) => {
    if (!serverID || !channelID) {
      console.error('Server ID or Channel ID is not defined');
      return;
    }

    const messageDoc = doc(db, 'Servers', serverID, 'Channels', channelID, 'Messages', id);
    await updateDoc(messageDoc, {
      message: newMessage,
      editedTimestamp: new Date(),
    });
  };

  const handleDeleteMessage = async (id: string) => {
    if (!serverID || !channelID) {
      console.error('Server ID or Channel ID is not defined');
      return;
    }

    const messageDoc = doc(db, 'Servers', serverID, 'Channels', channelID, 'Messages', id);
    await deleteDoc(messageDoc);
    setShowDeleteModal({ id: '', visible: false });
  };

  const handleMentionSelect = (displayName: string) => {
    setNewMessage(newMessage + `@${displayName} `);
    setMentionVisible(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    try {
      const messagesCollection = collection(db, 'Servers', serverID, 'Channels', channelID, 'Messages');
      const messageSnapshot = await getDocs(messagesCollection);

      const results: MessageData[] = [];
      messageSnapshot.forEach(doc => {
        const messageData = doc.data() as MessageData;
        if (messageData.message.includes(searchQuery)) {
          results.push({
            id: doc.id,
            ...messageData,
            timestamp: messageData.timestamp.toDate(),
            editedTimestamp: messageData.editedTimestamp ? messageData.editedTimestamp.toDate() : undefined
          });
        }
      });

      setSearchResults(results);
      setLoading(false);
    } catch (error) {
      console.error('Error searching messages:', error);
      setLoading(false);
    }
  };

  const handleSelectSearchResult = (id: string) => {
    const messageElement = document.getElementById(id);
    if (messageElement && chatContainerRef.current) {
      const elementOffset = messageElement.offsetTop;
      chatContainerRef.current.scrollTo({
        top: elementOffset - 100,
        behavior: 'smooth'
      });
      messageElement.classList.add('highlight');
      setTimeout(() => {
        messageElement.classList.remove('highlight');
      }, 1000);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-gray-700 overflow-hidden relative text-left">
      <div className="border-b border-gray-600 flex px-6 py-2 items-center flex-none shadow-xl">
        <div className="flex flex-col">
          <h3 className="mb-1 font-bold text-xl text-gray-100">
            <span className="text-gray-400">#</span> {channelName}
          </h3>
        </div>
        <div className="ml-auto flex items-center">
          <input
            type="text"
            className="w-64 px-4 py-2 bg-gray-600 text-white rounded-lg"
            placeholder="Search messages"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="ml-2 text-gray-400 hover:text-gray-200"
            >
              Cancel
            </button>
          )}
        </div>
      </div>
      {searchResults.length > 0 && (
        <div className="absolute top-16 left-0 right-0 bg-gray-800 p-4 max-h-64 overflow-y-auto z-10 overflow-x-hidden mx-2 rounded-md">
          {searchResults.map(result => (
            <div
              key={result.id}
              className="text-white cursor-pointer p-2 hover:bg-gray-700"
              onClick={() => handleSelectSearchResult(result.id)}
            >
              <p><strong>{result.user}:</strong> {result.message}</p>
              <span className="text-gray-400 text-xs">{new Date(result.timestamp).toLocaleString()}</span>
            </div>
          ))}
        </div>
      )}
      {searchResults.length === 0 && searchQuery && (
        <div className="absolute top-16 left-0 right-0 bg-gray-800 p-4 z-10 mx-3 rounded-md">
          <p className="text-white text-center">No Result Found!</p>
        </div>
      )}
      <div className="px-6 py-4 flex-1 overflow-y-scroll" onScroll={handleScroll} ref={chatContainerRef}>
        {loading ? (
          <p className="text-gray-400 text-center">Loading messages...</p>
        ) : (
          messages.map((msg) => (
            <Message
              key={msg.id}
              id={msg.id}
              src={msg.profilePicture}
              user={msg.user}
              message={msg.message}
              time={new Date(msg.timestamp).toLocaleTimeString()}
              editedTime={msg.editedTimestamp ? new Date(msg.editedTimestamp).toLocaleTimeString() : undefined}
              onDelete={() => setShowDeleteModal({ id: msg.id, visible: true })}
              onEdit={(newMessage) => handleEditMessage(msg.id, newMessage)}
              isMentioned={
                (currentUserNickname && msg.message.includes(`@${currentUserNickname}`)) ||
                (currentUser?.displayName && msg.message.includes(`@${currentUser.displayName}`)) ||
                msg.message.includes(`@everyone`)
              }
            />
          ))
        )}
      </div>
      {showDeleteModal.visible && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
          <div className="bg-gray-800 p-4 rounded-lg">
            <h2 className="text-white mb-4">Are you sure you want to delete this message?</h2>
            <div className="flex justify-end">
              <button
                onClick={() => setShowDeleteModal({ id: '', visible: false })}
                className="text-gray-400 hover:text-gray-200 mr-4"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeleteMessage(showDeleteModal.id)}
                className="bg-red-500 hover:bg-red-700 text-white py-1 px-3 rounded"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="pb-6 px-4 flex-none relative">
        {filePreview && (
          <div className="mt-2 p-2 bg-gray-800 rounded-lg relative">
            <button
              onClick={handleCancelUpload}
              className="absolute top-2 right-2 text-red-500 hover:text-red-700"
            >
              ✖
            </button>
            {isImage(filePreview) ? (
              <img src={filePreview} alt="Preview" className="max-w-full h-auto rounded" />
            ) : isVideo(filePreview) ? (
              <video controls className="max-w-full h-auto rounded">
                <source src={filePreview} type="video/mp4" />
                Your browser does not support the video tag.
              </video>
            ) : (
              <div className="flex items-center">
                <div className="mr-2">
                  <svg
                    className="w-6 h-6 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M7 7H3v16h18V7h-4V1H7v6zM3 7l6-6m12 6h-6V1m0 0L3 7"
                    />
                  </svg>
                </div>
                <div className="text-white">
                  {selectedFile?.name}
                </div>
              </div>
            )}
          </div>
        )}
        <div className="flex rounded-lg overflow-hidden mt-2">
          <span className="text-3xl text-grey border-r-4 border-gray-600 bg-gray-600 p-2 cursor-pointer" onClick={() => setEmojiTrayVisible(!emojiTrayVisible)}>
            😊
          </span>
            {emojiTrayVisible && (
              <div className="absolute bottom-16 bg-gray-600 p-2 rounded shadow-lg grid grid-cols-5 gap-2">
                {emojis.map(emoji => (
                  <span key={emoji} className="text-2xl cursor-pointer" onClick={() => handleSelectEmoji(emoji)}>{emoji}</span>
                ))}
              </div>
            )}
          <input
            type="text"
            className="w-full px-4 bg-gray-600 text-white"
            placeholder={`Message #${channelName}`}
            value={newMessage}
            onChange={(e) => {
              setNewMessage(e.target.value);
              setMentionVisible(e.target.value.includes('@'));
            }}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
          />
          <input
            type="file"
            className="hidden"
            id="fileInput"
            onChange={handleFileChange}
          />
          <label htmlFor="fileInput" className="text-3xl text-grey border-r-4 border-gray-600 bg-gray-600 p-2 cursor-pointer">
            📎
          </label>
          <span className="text-3xl text-grey border-r-4 border-gray-600 bg-gray-600 p-2 cursor-pointer" onClick={handleSendMessage}>
            📤
          </span>
        </div>
        {mentionVisible && <MentionsList members={mentionList} onSelect={handleMentionSelect} />}
      </div>
    </div>
  );
};

export default Chat;


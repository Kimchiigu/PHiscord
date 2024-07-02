import React, { useEffect, useState } from 'react';
import { db, storage } from './firebaseConfig';
import { collection, getDocs, addDoc, query, orderBy, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useAuth } from './provider/AuthProvider';
import Message from './Message';

interface MessageData {
  id: string;
  user: string;
  message: string;
  timestamp: Date;
  profilePicture: string;
}

const Chat: React.FC<{ channelID: string; channelName: string }> = ({ channelID, channelName }) => {
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [emojiTrayVisible, setEmojiTrayVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);

  const defaultProfilePicture = "https://cdn.discordapp.com/embed/avatars/0.png";
  const emojis = ['😀', '😂', '😍', '😎', '😭', '😡', '👍', '👎', '🙏', '💪'];

  const isImage = (url: string) => /(\.jpeg|\.jpg|\.gif|\.png)$/.test(url);
  const isVideo = (url: string) => /(\.mp4|\.webm|\.ogg)$/.test(url);

  useEffect(() => {
    const fetchMessages = () => {
      setLoading(true);
      const messagesCollection = collection(db, 'Servers', channelID, 'Messages');
      const messagesQuery = query(messagesCollection, orderBy('timestamp', 'asc'));

      onSnapshot(messagesQuery, (snapshot) => {
        const messagesList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as MessageData[];
        setMessages(messagesList);
        setLoading(false);
      });
    };

    if (channelID) {
      fetchMessages();
    }
  }, [channelID]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' && !selectedFile) return;
    const messagesCollection = collection(db, 'Servers', channelID, 'Messages');
    const timestamp = new Date();
    let fileUrl = '';

    if (selectedFile) {
      const fileRef = ref(storage, `files/${channelID}/${selectedFile.name}`);
      await uploadBytes(fileRef, selectedFile);
      fileUrl = await getDownloadURL(fileRef);
    }

    await addDoc(messagesCollection, {
      user: currentUser?.displayName || 'Anonymous',
      message: fileUrl || newMessage,
      timestamp,
      profilePicture: currentUser?.photoURL || defaultProfilePicture,
    });

    setNewMessage('');
    setSelectedFile(null);
    setFilePreview(null);
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

  return (
    <div className="flex-1 flex flex-col bg-gray-700 overflow-hidden">
      <div className="border-b border-gray-600 flex px-6 py-2 items-center flex-none shadow-xl">
        <div className="flex flex-col">
          <h3 className="text-white mb-1 font-bold text-xl text-gray-100">
            <span className="text-gray-400">#</span> {channelName}
          </h3>
        </div>
      </div>
      <div className="px-6 py-4 flex-1 overflow-y-scroll">
        {loading ? (
          <p className="text-gray-400">Loading messages...</p>
        ) : (
          messages.map((msg) => (
            <Message
              key={msg.id}
              src={msg.profilePicture}
              user={msg.user}
              message={msg.message}
              time={new Date(msg.timestamp).toLocaleTimeString()}
            />
          ))
        )}
      </div>
      <div className="pb-6 px-4 flex-none">
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
            onChange={(e) => setNewMessage(e.target.value)}
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
      </div>
    </div>
  );
};

export default Chat;

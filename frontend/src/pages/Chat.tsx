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

    const defaultProfilePicture = "https://cdn.discordapp.com/embed/avatars/0.png";
    const emojis = ['😀', '😂', '😍', '😎', '😭', '😡', '👍', '👎', '🙏', '💪'];

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
            message: fileUrl ? `${newMessage} ${fileUrl}` : newMessage,
            timestamp,
            profilePicture: currentUser?.photoURL || defaultProfilePicture,
        });

        setNewMessage('');
        setSelectedFile(null);
    };

    const handleSelectEmoji = (emoji: string) => {
        setNewMessage(newMessage + emoji);
        setEmojiTrayVisible(false);
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
                    messages.map((msg, index) => (
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
                <div className="flex rounded-lg overflow-hidden">
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
                        onChange={(e) => setSelectedFile(e.target.files ? e.target.files[0] : null)}
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

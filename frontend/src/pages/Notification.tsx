import React, { useEffect, useState } from 'react';
import { db } from './FirebaseConfig';
import { collection, query, where, onSnapshot, doc, writeBatch } from 'firebase/firestore';
import { useAuth } from './provider/AuthProvider';

interface Notification {
  id: string;
  type: 'DM' | 'Channel';
  sender: string;
  content: string;
  docId: string;
  channelName?: string;
  timestamp: Date;
}

const Notification: React.FC = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);

  useEffect(() => {
    if (!currentUser) return;

    const q = query(collection(db, 'Notifications'), where('userId', '==', currentUser.uid));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const notificationsList: Notification[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notificationsList.push({
          id: doc.id,
          type: data.type,
          sender: data.sender,
          content: data.content,
          docId: data.docId,
          channelName: data.channelName,
          timestamp: data.timestamp.toDate(),
        });
      });
      // Sort notifications by timestamp, newest first
      notificationsList.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      setNotifications(notificationsList);
    });

    return () => {
      unsubscribe();
    };
  }, [currentUser]);

  const handleDeleteAll = async () => {
    try {
      const batch = writeBatch(db);
      notifications.forEach((notification) => {
        const docRef = doc(db, 'Notifications', notification.id);
        batch.delete(docRef);
      });
      await batch.commit();
    } catch (error) {
      console.error('Error deleting notifications: ', error);
    }
  };

  return (
    <div className="flex-1 p-6 bg-[--bg-color]">
      <h2 className="text-2xl font-bold text-[--primary-text-color] mb-4">Notifications</h2>
      <button
        onClick={handleDeleteAll}
        className="mb-4 px-4 py-2 bg-red-600 text-[--primary-text-color] rounded hover:bg-red-700"
      >
        Delete All
      </button>
      {notifications.length === 0 ? (
        <p className="text-[--secondary-text-color]">No notifications</p>
      ) : (
        <ul>
          {notifications.map((notification) => (
            <li key={notification.id} className="mb-4 p-4 bg-[--primary-bg-color] rounded text-left">
              <p className="text-[--primary-text-color]">
                <strong>{notification.sender}</strong> {notification.type === 'DM' ? 'sent you a message' : `in ${notification.channelName}`}:
              </p>
              <p className="text-[--secondary-text-color]">{notification.content}</p>
              <p className="text-[--secondary-text-color] text-sm">{notification.timestamp.toLocaleString()}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Notification;

import React, { useEffect, useState } from 'react';
import { db } from '../FirebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

interface FriendProfileProps {
  friendId: string;
  onCallInitiate: (callType: 'voice' | 'video', friendId: string, friendDisplayName: string) => void;
}

interface FriendData {
  displayName: string;
  profilePicture: string;
  customStatus: string;
  isOnline: boolean;
}

const FriendProfile: React.FC<FriendProfileProps> = ({ friendId, onCallInitiate }) => {
  const [friendData, setFriendData] = useState<FriendData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFriendData = async () => {
      try {
        const friendDoc = await getDoc(doc(db, 'Users', friendId));
        if (friendDoc.exists()) {
          setFriendData(friendDoc.data() as FriendData);
        }
        setLoading(false);
      } catch (error) {
        console.error('Error fetching friend data:', error);
        setLoading(false);
      }
    };

    fetchFriendData();
  }, [friendId]);

  return (
    <div className="bg-[--secondary-bg-color] text-purple-lighter flex-none w-64 pb-6 hidden md:block relative">
      {loading ? (
        <p className="text-[--secondary-text-color] text-center">Loading...</p>
      ) : (
        friendData && (
          <div className="p-4">
            <img
              src={friendData.profilePicture || "https://cdn.discordapp.com/embed/avatars/0.png"}
              alt="Profile"
              className="w-32 h-32 rounded-full mx-auto mb-4"
            />
            <h2 className="text-[--primary-text-color] text-xl text-center">{friendData.displayName}</h2>
            <p className="text-[--secondary-text-color] text-center">{friendData.customStatus || friendData.isOnline ? "Online" : "Offline"}</p>
            <div className="flex flex-col">
              <button
                className='bg-indigo-500 text-gray-100 rounded-md py-2 mt-3 mb-2 hover:bg-indigo-600 transition-all'
                onClick={() => onCallInitiate('voice', friendId, friendData.displayName)}
                disabled={!friendData.isOnline}
              >
                Voice Call
              </button>
              <button
                className='bg-indigo-500 text-gray-100 rounded-md py-2 hover:bg-indigo-600 transition-all'
                onClick={() => onCallInitiate('video', friendId, friendData.displayName)}
                disabled={!friendData.isOnline}
              >
                Video Call
              </button>
              {!friendData.isOnline && (
                <p className="text-red-500 text-center mt-2">Can't make a call, user is offline</p>
              )}
            </div>
          </div>
        )
      )}
    </div>
  );
};

export default FriendProfile;
  
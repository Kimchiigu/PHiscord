import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { doc, getDoc } from 'firebase/firestore';

interface FriendProfileProps {
  friendId: string;
}

interface FriendData {
  displayName: string;
  profilePicture: string;
  email: string;
}

const FriendProfile: React.FC<FriendProfileProps> = ({ friendId }) => {
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
    <div className="bg-gray-800 text-purple-lighter flex-none w-64 pb-6 hidden md:block relative">
      {loading ? (
        <p className="text-gray-400 text-center">Loading...</p>
      ) : (
        friendData && (
          <div className="p-4">
            <img
              src={friendData.profilePicture || "https://cdn.discordapp.com/embed/avatars/0.png"}
              alt="Profile"
              className="w-32 h-32 rounded-full mx-auto mb-4"
            />
            <h2 className="text-white text-xl text-center">{friendData.displayName}</h2>
            <p className="text-gray-400 text-center">{friendData.email}</p>
          </div>
        )
      )}
    </div>
  );
};

export default FriendProfile;

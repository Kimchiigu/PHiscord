import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, getDoc, CollectionReference } from 'firebase/firestore';
import { useAuth } from '../provider/AuthProvider';
import ProfileBar from '../ProfileBar';

interface Friend {
  userId: string;
  displayName: string;
  profilePicture: string;
}

interface FriendListProps {
  onFriendSelect: (friend: Friend) => void;
  onCategorySelect: () => void; 
}

const FriendList: React.FC<FriendListProps> = ({ onFriendSelect, onCategorySelect }) => {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const defaultProfilePicture = "https://cdn.discordapp.com/embed/avatars/0.png";

  useEffect(() => {
    const fetchFriends = async () => {
      if (!currentUser) return;

      setLoading(true);
      const friendsCollection = collection(db, 'Users', currentUser.uid, 'Friends');

      const collectionExists = async (collectionRef: CollectionReference) => {
        const snapshot = await getDocs(collectionRef);
        return !snapshot.empty;
      };

      const friendsExists = await collectionExists(friendsCollection);

      if (!friendsExists) {
        setLoading(false);
        return;
      }

      const [friendSnapshot] = await Promise.all([
        friendsExists ? getDocs(friendsCollection) : Promise.resolve({ docs: [] }),
      ]);

      const friendsList: Friend[] = [];

      for (const friendDoc of friendSnapshot.docs) {
        const friendData = friendDoc.data();
        const userDoc = await getDoc(doc(db, 'Users', friendData.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          friendsList.push({
            userId: friendData.userId,
            displayName: userData.displayName || 'Anonymous',
            profilePicture: userData.profilePicture || defaultProfilePicture,
          });
        }
      }

      setFriends(friendsList);
      setLoading(false);
    };

    fetchFriends();
  }, [currentUser]);

  return (
    <div className="bg-gray-800 text-purple-lighter flex-none w-64 pb-6 hidden md:block relative">
      <div className="text-white mb-2 mt-3 px-4 flex justify-between border-b border-gray-600 py-1 shadow-xl">
        <div className="flex-auto">
          <h1 className="font-semibold text-xl leading-tight mb-1 truncate">Direct Message</h1>
        </div>
      </div>
      <div className="mb-4 px-4 text-left">
        <button 
          className='bg-indigo-600 flex justify-center items-center py-3 rounded-lg mb-5 mt-5 w-full'
          onClick={onCategorySelect}
        >
          <h1 className="text-gray-100 font-semibold text-left text-sm">FRIENDS</h1>
        </button>
        {loading ? (
          <p className="text-gray-400 text-center">Loading friends list...</p>
        ) : (
          <>
            {friends.length > 0 && (
              <>
                <h1 className="text-gray-400 font-semibold text-left mb-2 text-sm">DIRECT MESSAGES</h1>
                {friends.map((friend) => (
                  <div key={friend.userId} className="flex items-center mb-2 cursor-pointer" onClick={() => onFriendSelect(friend)}>
                    <img src={friend.profilePicture} alt="Friend" className="w-10 h-10 rounded-full mr-3" />
                    <div className="flex flex-col">
                      <span className="font-bold text-white text-left">{friend.displayName}</span>
                    </div>
                  </div>
                ))}
              </>
            )}     
          </>
        )}
        <ProfileBar /> 
      </div>
    </div>
  );
};

export default FriendList;

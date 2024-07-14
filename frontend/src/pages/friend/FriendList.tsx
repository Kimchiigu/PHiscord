import React, { useEffect, useState } from 'react';
import { db } from '../FirebaseConfig';
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
  onCategorySelect: (category: 'friends' | 'notifications') => void;
}

const FriendList: React.FC<FriendListProps> = ({ onFriendSelect, onCategorySelect }) => {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [guests, setGuests] = useState<Friend[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [privacySettings, setPrivacySettings] = useState<any>({});
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [guestToOpen, setGuestToOpen] = useState<Friend | null>(null);

  const defaultProfilePicture = "https://cdn.discordapp.com/embed/avatars/0.png";

  useEffect(() => {
    const fetchPrivacySettings = async () => {
      if (!currentUser) return;
      const settingsDoc = await getDoc(doc(db, 'Users', currentUser.uid, 'Settings', 'Privacy'));
      if (settingsDoc.exists()) {
        setPrivacySettings(settingsDoc.data());
      }
    };

    const fetchFriendsAndGuests = async () => {
      if (!currentUser) return;

      setLoading(true);
      const friendsCollection = collection(db, 'Users', currentUser.uid, 'Friends');
      const guestsCollection = collection(db, 'Users', currentUser.uid, 'Guests');

      const collectionExists = async (collectionRef: CollectionReference) => {
        const snapshot = await getDocs(collectionRef);
        return !snapshot.empty;
      };

      const friendsExists = await collectionExists(friendsCollection);
      const guestsExists = await collectionExists(guestsCollection);

      const [friendSnapshot, guestSnapshot] = await Promise.all([
        friendsExists ? getDocs(friendsCollection) : Promise.resolve({ docs: [] }),
        guestsExists ? getDocs(guestsCollection) : Promise.resolve({ docs: [] }),
      ]);

      const friendsList: Friend[] = [];
      const guestsList: Friend[] = [];

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

      for (const guestDoc of guestSnapshot.docs) {
        const guestData = guestDoc.data();
        const userDoc = await getDoc(doc(db, 'Users', guestData.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          guestsList.push({
            userId: guestData.userId,
            displayName: userData.displayName || 'Anonymous',
            profilePicture: userData.profilePicture || defaultProfilePicture,
          });
        }
      }

      setFriends(friendsList);
      setGuests(guestsList);
      setLoading(false);
    };

    fetchPrivacySettings();
    fetchFriendsAndGuests();
  }, [currentUser]);

  const handleGuestClick = (guest: Friend) => {
    if (privacySettings.guestMessages === 'hide') {
      setGuestToOpen(guest);
      setModalIsOpen(true);
    } else if (privacySettings.guestMessages === 'allow') {
      onFriendSelect(guest);
    }
  };

  const handleModalClose = (openChat: boolean) => {
    if (openChat && guestToOpen) {
      onFriendSelect(guestToOpen);
    }
    setGuestToOpen(null);
    setModalIsOpen(false);
  };

  return (
    <div className="bg-[--secondary-bg-color] text-purple-lighter flex-none w-64 pb-6 hidden md:block relative">
      <div className="text-[--primary-text-color] mb-2 mt-3 px-4 flex justify-between border-b border-gray-600 py-1 shadow-xl">
        <div className="flex-auto">
          <h1 className="font-semibold text-xl leading-tight mb-3 truncate">Direct Message</h1>
        </div>
      </div>
      <div className="mb-4 px-4 text-left">
        <button
          className='bg-violet-600 flex justify-center items-center py-3 rounded-lg mt-5 mb-2 w-full'
          onClick={() => onCategorySelect('notifications')}
        >
          <h1 className="text-[--primary-text-color] font-semibold text-left text-sm">NOTIFICATIONS</h1>
        </button>
        <button
          className='bg-indigo-600 flex justify-center items-center py-3 rounded-lg mb-5 w-full'
          onClick={() => onCategorySelect('friends')}
        >
          <h1 className="text-[--primary-text-color] font-semibold text-left text-sm">FRIENDS</h1>
        </button>
        {loading ? (
          <p className="text-[--secondary-text-color] text-center">Loading friends list...</p>
        ) : (
          <>
            {friends.length > 0 && (
              <>
                <h1 className="text-[--secondary-text-color] font-semibold text-left mb-2 text-sm">DIRECT MESSAGES</h1>
                {friends.map((friend) => (
                  <div key={friend.userId} className="flex items-center mb-2 cursor-pointer" onClick={() => onFriendSelect(friend)}>
                    <img src={friend.profilePicture} alt="Friend" className="w-10 h-10 rounded-full mr-3" />
                    <div className="flex flex-col">
                      <span className="font-bold text-[--primary-text-color] text-left">{friend.displayName}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
            {privacySettings.guestMessages !== 'block' && guests.length > 0 && (
              <>
                <h1 className="text-[--secondary-text-color] font-semibold text-left mb-2 text-sm">STRANGERS</h1>
                {guests.map((guest) => (
                  <div key={guest.userId} className="flex items-center mb-2 cursor-pointer" onClick={() => handleGuestClick(guest)}>
                    <img src={guest.profilePicture} alt="Guest" className="w-10 h-10 rounded-full mr-3" />
                    <div className="flex flex-col">
                      <span className="font-bold text-[--primary-text-color] text-left">{guest.displayName}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
        <ProfileBar />
      </div>
      {modalIsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[--primary-bg-color] p-8 rounded-lg shadow-md w-full max-w-md mx-auto">
            <h2 className="text-[--primary-text-color] text-xl font-bold mb-4">Guest Message</h2>
            <p className="text-[--secondary-text-color] mb-6">Do you want to open the message from this guest?</p>
            <div className="flex justify-end space-x-4">
              <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-[--primary-text-color] rounded" onClick={() => handleModalClose(false)}>
                No
              </button>
              <button className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-[--primary-text-color] rounded" onClick={() => handleModalClose(true)}>
                Yes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FriendList;

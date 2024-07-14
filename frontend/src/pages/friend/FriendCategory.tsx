import React, { useEffect, useState } from 'react';
import { db, storage } from '../FirebaseConfig';
import { collection, getDocs, addDoc, getDoc, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { getDownloadURL, ref } from 'firebase/storage';

interface FriendCategoryProps {
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
}

const FriendCategory: React.FC<FriendCategoryProps> = ({ selectedTab, setSelectedTab }) => {
  const { currentUser } = getAuth();
  const [friends, setFriends] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [newFriendId, setNewFriendId] = useState<string>('');

  const currentUserId = currentUser?.uid;
  const defaultProfilePicture = "https://cdn.discordapp.com/embed/avatars/0.png";

  const fetchFriends = async (tab: string) => {
    if (!currentUserId) return;

    setLoading(true);
    try {
      let friendsQuery;

      if (tab === 'online') {
        const onlineFriends: any[] = [];
        const friendsSnapshot = await getDocs(collection(db, 'Users', currentUserId, 'Friends'));
        for (const friendDoc of friendsSnapshot.docs) {
          const friendData = friendDoc.data();
          const userDoc = await getDoc(doc(db, 'Users', friendData.userId));
          if (userDoc.exists() && userDoc.data().isOnline) {
            const userData = userDoc.data();
            let profilePictureUrl = defaultProfilePicture;
            if (userData.profilePicture != null) {
              profilePictureUrl = await getDownloadURL(ref(storage, `${userData.profilePicture}`));
            }
            onlineFriends.push({ id: friendDoc.id, ...friendData, ...userData, profilePictureUrl });
          }
        }
        setFriends(onlineFriends);
      } else if (tab === 'all') {
        friendsQuery = collection(db, 'Users', currentUserId, 'Friends');
      } else if (tab === 'blocked') {
        friendsQuery = collection(db, 'Users', currentUserId, 'Blocked');
      } else if (tab === 'pending') {
        const pendingFriends: any[] = [];
        const pendingSnapshot = await getDocs(collection(db, 'FriendRequests'));
        for (const requestDoc of pendingSnapshot.docs) {
          const requestData = requestDoc.data();
          if (requestData.receiverId === currentUserId && requestData.status === 'waiting') {
            const userDoc = await getDoc(doc(db, 'Users', requestData.senderId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              let profilePictureUrl = defaultProfilePicture;
              if (userData.profilePicture != null) {
                profilePictureUrl = await getDownloadURL(ref(storage, `${userData.profilePicture}`));
              }
              pendingFriends.push({ id: requestDoc.id, ...requestData, ...userData, profilePictureUrl });
            }
          }
        }
        setFriends(pendingFriends);
      }

      if (friendsQuery) {
        const friendsSnapshot = await getDocs(friendsQuery);
        const friendsList = [];
        for (const friendDoc of friendsSnapshot.docs) {
          const friendData = friendDoc.data();
          const userDoc = await getDoc(doc(db, 'Users', friendData.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            let profilePictureUrl = defaultProfilePicture;
            if (userData.profilePicture) {
              profilePictureUrl = await getDownloadURL(ref(storage, `${userData.profilePicture}`));;
            }
            friendsList.push({ id: friendDoc.id, ...friendData, ...userData, profilePictureUrl });
          }
        }
        setFriends(friendsList);
      }
    } catch (error) {
      console.error("Error fetching friends: ", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (selectedTab === 'online' || selectedTab === 'all' || selectedTab === 'blocked' || selectedTab === 'pending') {
      fetchFriends(selectedTab);
    }
  }, [selectedTab]);

  const handleAddFriend = async () => {
    if (!newFriendId || newFriendId === currentUserId) return;

    setLoading(true);

    try {
      const userDoc = await getDoc(doc(db, 'Users', newFriendId));
      if (userDoc.exists()) {
        await addDoc(collection(db, 'Users', currentUserId!, 'Friends'), { userId: newFriendId });
        alert("Friend added successfully");
        setNewFriendId('');
      } else {
        alert("User not found");
      }
    } catch (error) {
      console.error("Error adding friend: ", error);
    }
    setLoading(false);
  };

  const handleAcceptFriendRequest = async (requestId: string, senderId: string) => {
    if (!currentUserId) return;

    try {
      await updateDoc(doc(db, 'FriendRequests', requestId), { status: 'accepted' });
      await addDoc(collection(db, 'Users', currentUserId, 'Friends'), { userId: senderId });
      await addDoc(collection(db, 'Users', senderId, 'Friends'), { userId: currentUserId });
      alert('Friend request accepted');
      fetchFriends('pending');
    } catch (error) {
      console.error('Error accepting friend request:', error);
    }
  };

  const handleDeclineFriendRequest = async (requestId: string) => {
    if (!currentUserId) return;

    try {
      await updateDoc(doc(db, 'FriendRequests', requestId), { status: 'declined' });
      alert('Friend request declined');
      fetchFriends('pending');
    } catch (error) {
      console.error('Error declining friend request:', error);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!currentUserId) return;

    try {
      await deleteDoc(doc(db, 'Users', currentUserId, 'Friends', friendId));
      setFriends(friends.filter(friend => friend.id !== friendId));
      alert('Friend removed successfully');
    } catch (error) {
      console.error('Error removing friend:', error);
    }
  };

  const handleBlockFriend = async (friendId: string) => {
    if (!currentUserId) return;

    try {
      const friendDoc = await getDoc(doc(db, 'Users', currentUserId, 'Friends', friendId));
      if (friendDoc.exists()) {
        const friendData = friendDoc.data();
        await addDoc(collection(db, 'Users', currentUserId, 'Blocked'), { userId: friendData.userId });
        await deleteDoc(doc(db, 'Users', currentUserId, 'Friends', friendId));
        setFriends(friends.filter(friend => friend.id !== friendId));
        alert('Friend blocked successfully');
      }
    } catch (error) {
      console.error('Error blocking friend:', error);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    if (!currentUserId) return;

    try {
      await deleteDoc(doc(db, 'Users', currentUserId, 'Blocked', userId));
      setFriends(friends.filter(friend => friend.id !== userId));
      alert('User unblocked successfully');
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };

  return (
    <div className="bg-[--bg-color] text-purple-lighter w-full pb-6 md:block relative flex-1 flex flex-col items-center pt-12">
      <div className="flex w-full justify-center">
        <ul className="flex space-x-4 text-sm font-medium text-gray-500 dark:text-[--secondary-text-color] mb-4">
          <li>
            <a
              href="#"
              className={`inline-flex items-center px-4 py-3 rounded-lg ${selectedTab === 'online' ? 'bg-blue-700 text-[--primary-text-color] dark:bg-blue-600' : 'hover:text-gray-900 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-[--primary-text-color]'}`}
              onClick={() => setSelectedTab('online')}
            >
              Online
            </a>
          </li>
          <li>
            <a
              href="#"
              className={`inline-flex items-center px-4 py-3 rounded-lg ${selectedTab === 'all' ? 'bg-blue-700 text-[--primary-text-color] dark:bg-blue-600' : 'hover:text-gray-900 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-[--primary-text-color]'}`}
              onClick={() => setSelectedTab('all')}
            >
              All
            </a>
          </li>
          <li>
            <a
              href="#"
              className={`inline-flex items-center px-4 py-3 rounded-lg ${selectedTab === 'pending' ? 'bg-blue-700 text-[--primary-text-color] dark:bg-blue-600' : 'hover:text-gray-900 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-[--primary-text-color]'}`}
              onClick={() => setSelectedTab('pending')}
            >
              Pending
            </a>
          </li>
          <li>
            <a
              href="#"
              className={`inline-flex items-center px-4 py-3 rounded-lg ${selectedTab === 'blocked' ? 'bg-blue-700 text-[--primary-text-color] dark:bg-blue-600' : 'hover:text-gray-900 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-[--primary-text-color]'}`}
              onClick={() => setSelectedTab('blocked')}
            >
              Blocked
            </a>
          </li>
          <li>
            <a
              href="#"
              className={`inline-flex items-center px-4 py-3 rounded-lg ${selectedTab === 'addFriend' ? 'bg-blue-700 text-[--primary-text-color] dark:bg-blue-600' : 'hover:text-gray-900 bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-700 dark:hover:text-[--primary-text-color]'}`}
              onClick={() => setSelectedTab('addFriend')}
            >
              Add Friend
            </a>
          </li>
        </ul>
      </div>
      <div className="p-6 bg-[--primary-bg-color] text-medium text-[--secondary-text-color] rounded-lg w-[90%] ml-12">
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : friends.length === 0 ? (
          <p className="text-center">Empty...</p>
        ) : (
          <div>
            {selectedTab === 'addFriend' ? (
              <div>
                <input
                  type="text"
                  placeholder="Enter user ID"
                  value={newFriendId}
                  onChange={(e) => setNewFriendId(e.target.value)}
                  className="px-4 py-2 rounded bg-gray-600 text-[--primary-text-color] w-full mb-4"
                />
                <button
                  onClick={handleAddFriend}
                  className="px-4 py-2 rounded bg-blue-600 text-[--primary-text-color]"
                >
                  Add Friend
                </button>
              </div>
            ) : selectedTab === 'pending' ? (
              friends.map(friend => (
                <div key={friend.id} className="mb-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <img src={friend.profilePicture} alt="Profile" className="w-10 h-10 rounded-full mr-4" />
                    <div>
                      <p className="text-[--primary-text-color] text-left">{friend.displayName}</p>
                      <p className="text-[--secondary-text-color] text-sm text-left">{friend.customStatus || (friend.isOnline ? "Online" : "Offline")}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                    <button onClick={() => handleAcceptFriendRequest(friend.id, friend.senderId)} className="px-3 py-1 rounded bg-green-600 text-[--primary-text-color]">Accept</button>
                    <button onClick={() => handleDeclineFriendRequest(friend.id)} className="px-3 py-1 rounded bg-red-600 text-[--primary-text-color]">Decline</button>
                  </div>
                </div>
              ))
            ) : (
              friends.map(friend => (
                <div key={friend.id} className="mb-4 flex items-center justify-between">
                  <div className="flex items-center">
                    <img src={friend.profilePicture} alt="Profile" className="w-10 h-10 rounded-full mr-4" />
                    <div>
                      <p className="text-[--primary-text-color] text-left">{friend.displayName || friend.userId}</p>
                      <p className="text-[--secondary-text-color] text-sm text-left">{friend.customStatus || (friend.isOnline ? "Online" : "Offline")}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-4">
                  {selectedTab === 'blocked' ? (
                      <button onClick={() => handleUnblockUser(friend.id)} className="px-3 py-1 rounded bg-red-600 text-[--primary-text-color]">Unblock</button>
                    ) : (
                      <>
                        <button onClick={() => handleRemoveFriend(friend.id)} className="px-3 py-1 rounded bg-red-600 text-[--primary-text-color]">Remove</button>
                        <button onClick={() => handleBlockFriend(friend.id)} className="px-3 py-1 rounded bg-purple-600 text-[--primary-text-color]">Block</button>
                      </>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default FriendCategory;

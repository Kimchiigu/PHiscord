import React, { useEffect, useState } from 'react';
import { db } from './firebaseConfig';
import { collection, getDocs, doc, getDoc, setDoc, addDoc, query, where, deleteDoc } from 'firebase/firestore';
import { useAuth } from './provider/AuthProvider';

interface Member {
  userId: string;
  displayName: string;
  profilePicture: string;
  role: string;
}

interface MemberListProps {
  serverID: string;
}

interface UserDetails {
  displayName: string;
  username: string;
  profilePicture: string;
  userId: string;
}

const MemberList: React.FC<MemberListProps> = ({ serverID }) => {
  const { currentUser } = useAuth();
  const [owner, setOwner] = useState<Member | null>(null);
  const [admins, setAdmins] = useState<Member[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<UserDetails | null>(null);
  const [isFriend, setIsFriend] = useState<boolean>(false);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [dmMessage, setDmMessage] = useState<string>('');

  const defaultProfilePicture = "https://cdn.discordapp.com/embed/avatars/0.png";

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      const membersCollection = collection(db, 'Servers', serverID, 'Members');
      const memberSnapshot = await getDocs(membersCollection);

      const membersList: Member[] = [];
      const adminsList: Member[] = [];
      let ownerData: Member | null = null;

      for (const memberDoc of memberSnapshot.docs) {
        const memberData = memberDoc.data() as { userId: string; role: string };
        const userDoc = await getDoc(doc(db, 'Users', memberData.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          const member = {
            userId: memberData.userId,
            displayName: userData.displayName || 'Anonymous',
            profilePicture: userData.profilePicture || defaultProfilePicture,
            role: memberData.role,
          };

          if (memberData.role === 'owner') {
            ownerData = member;
          } else if (memberData.role === 'admin') {
            adminsList.push(member);
          } else {
            membersList.push(member);
          }
        }
      }

      setOwner(ownerData);
      setAdmins(adminsList);
      setMembers(membersList);
      setLoading(false);
    };

    fetchMembers();
  }, [serverID]);

  const handleMemberClick = async (userId: string) => {
    if (!currentUser) return;

    const userDoc = await getDoc(doc(db, 'Users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      setSelectedMember({
        displayName: userData.displayName,
        username: userData.username,
        profilePicture: userData.profilePicture || defaultProfilePicture,
        userId: userId,
      });

      if (userId !== currentUser.uid) {
        const friendsCollection = collection(db, 'Users', currentUser.uid, 'Friends');
        const friendDoc = await getDoc(doc(friendsCollection, userId));
        setIsFriend(friendDoc.exists());

        const blockedCollection = collection(db, 'Users', currentUser.uid, 'Blocked');
        const blockedDoc = await getDoc(doc(blockedCollection, userId));
        setIsBlocked(blockedDoc.exists());
      } else {
        setIsFriend(false);
        setIsBlocked(false);
      }
    }
  };

  const handleAddFriend = async (userId: string) => {
    if (!currentUser) return;

    try {
      const friendRef = doc(db, 'Users', currentUser.uid, 'Friends', userId);
      await setDoc(friendRef, { userId });
      setIsFriend(true);
    } catch (error) {
      console.error('Error adding friend:', error);
    }
  };

  const handleBlockUser = async (userId: string) => {
    if (!currentUser) return;

    try {
      const blockedRef = doc(db, 'Users', currentUser.uid, 'Blocked', userId);
      await setDoc(blockedRef, { userId });
      setIsBlocked(true);
    } catch (error) {
      console.error('Error blocking user:', error);
    }
  };

  const handleUnblockUser = async (userId: string) => {
    if (!currentUser) return;

    try {
      const blockedRef = doc(db, 'Users', currentUser.uid, 'Blocked', userId);
      await deleteDoc(blockedRef);
      setIsBlocked(false);
    } catch (error) {
      console.error('Error unblocking user:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!currentUser || !selectedMember || !dmMessage.trim()) return;

    const participants = [currentUser.uid, selectedMember.userId].sort();
    const dmsQuery = query(
      collection(db, 'DirectMessages'),
      where('participants', 'array-contains', currentUser.uid)
    );
    const dmsSnapshot = await getDocs(dmsQuery);
    let dmId = null;

    for (const doc of dmsSnapshot.docs) {
      const data = doc.data();
      if (data.participants.includes(selectedMember.userId)) {
        dmId = doc.id;
        break;
      }
    }

    if (!dmId) {
      const newDmDoc = await addDoc(collection(db, 'DirectMessages'), {
        participants,
      });
      dmId = newDmDoc.id;
    }

    const messagesCollection = collection(db, 'DirectMessages', dmId, 'Messages');
    const timestamp = new Date();
    await addDoc(messagesCollection, {
      user: currentUser.displayName || 'Anonymous',
      message: dmMessage,
      timestamp,
      profilePicture: currentUser.photoURL || defaultProfilePicture,
    });

    // Check if the target user is already a friend, if not add them as a guest
    const friendsCollection = collection(db, 'Users', currentUser.uid, 'Friends');
    const friendDoc = await getDoc(doc(friendsCollection, selectedMember.userId));
    if (!friendDoc.exists()) {
      await setDoc(doc(db, 'Users', currentUser.uid, 'Guests', selectedMember.userId), {
        userId: selectedMember.userId,
      });
      await setDoc(doc(db, 'Users', selectedMember.userId, 'Guests', currentUser.uid), {
        userId: currentUser.uid,
      });
    }

    setDmMessage('');
    setSelectedMember(null);
    // Navigate to DM list or do something else here
  };

  return (
    <div className="bg-gray-800 text-purple-lighter flex-none w-64 pb-6 hidden md:block relative">
      <div className="text-white mb-2 mt-3 px-4 flex justify-between border-b border-gray-600 py-1 shadow-xl">
        <div className="flex-auto">
          <h1 className="font-semibold text-xl leading-tight mb-1 truncate">Members</h1>
        </div>
      </div>
      <div className="mb-4 px-4 text-left">
        {loading ? (
          <p className="text-gray-400 text-center">Loading member list...</p>
        ) : (
          <>
            <h1 className="text-gray-400 font-semibold text-left mb-2 text-sm">OWNER</h1>
            {owner ? (
              <div className="flex items-center mb-2 cursor-pointer" onClick={() => handleMemberClick(owner.userId)}>
                <img src={owner.profilePicture} alt="Owner" className="w-10 h-10 rounded-full mr-3" />
                <div className="flex flex-col">
                  <span className="font-bold text-white text-left">{owner.displayName}</span>
                  <span className="text-sm text-gray-400 text-left">Owner</span>
                </div>
              </div>
            ) : (
              <p className="text-gray-400">NONE</p>
            )}
            <h1 className="text-gray-400 font-semibold text-left mt-6 mb-2 text-sm">ADMINS</h1>
            {admins.length > 0 ? (
              admins.map((admin) => (
                <div key={admin.userId} className="flex items-center mb-2 cursor-pointer" onClick={() => handleMemberClick(admin.userId)}>
                  <img src={admin.profilePicture} alt="Admin" className="w-10 h-10 rounded-full mr-3" />
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-left">{admin.displayName}</span>
                    <span className="text-sm text-gray-400 text-left">Admin</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400">NONE</p>
            )}
            <h1 className="text-gray-400 font-semibold text-left mt-6 mb-2 text-sm">MEMBERS</h1>
            {members.length > 0 ? (
              members.map((member) => (
                <div key={member.userId} className="flex items-center mb-2 cursor-pointer" onClick={() => handleMemberClick(member.userId)}>
                  <img src={member.profilePicture} alt="Member" className="w-10 h-10 rounded-full mr-3" />
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-left">{member.displayName}</span>
                    <span className="text-sm text-gray-400 text-left">Member</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-400">NONE</p>
            )}
          </>
        )}
      </div>

      {selectedMember && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-gray-800 rounded-lg p-4 max-w-md w-full">
            <h2 className="text-white text-xl font-bold mb-4">Profile Details</h2>
            <div className="flex items-center mb-4">
              <img src={selectedMember.profilePicture} alt="Profile" className="w-16 h-16 rounded-full mr-4" />
              <div className="flex flex-col">
                <span className="text-white text-lg font-bold">{selectedMember.displayName}</span>
                <span className="text-gray-400">@{selectedMember.username}</span>
              </div>
            </div>
            <div className="flex flex-col mb-4">
              {selectedMember.userId !== currentUser?.uid && (
                <>
                  {isFriend ? (
                    <button className="px-4 py-2 bg-green-500 text-white rounded mb-2" disabled>
                      Already Friends
                    </button>
                  ) : (
                    <button className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded mb-2" onClick={() => handleAddFriend(selectedMember.userId)}>
                      Add Friend
                    </button>
                  )}
                  {isBlocked ? (
                    <button className="px-4 py-2 bg-red-500 hover:bg-red-700 text-white rounded mb-2" onClick={() => handleUnblockUser(selectedMember.userId)}>
                      Unblock User
                    </button>
                  ) : (
                    <button className="px-4 py-2 bg-red-500 hover:bg-red-700 text-white rounded mb-2" onClick={() => handleBlockUser(selectedMember.userId)}>
                      Block User
                    </button>
                  )}
                  <input
                    type="text"
                    className="w-full px-4 py-2 bg-gray-600 text-white rounded mb-2"
                    placeholder="Send a message"
                    value={dmMessage}
                    onChange={(e) => setDmMessage(e.target.value)}
                  />
                  <button className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-white rounded" onClick={handleSendMessage}>
                    Send Message
                  </button>
                </>
              )}
              <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded mt-2" onClick={() => setSelectedMember(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberList;

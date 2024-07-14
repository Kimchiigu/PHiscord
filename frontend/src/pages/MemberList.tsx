import React, { useEffect, useState } from 'react';
import { db } from '../FirebaseConfig';
import { collection, doc, getDoc, getDocs, query, where, onSnapshot, addDoc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from './provider/AuthProvider';

interface Member {
  userId: string;
  displayName: string;
  profilePicture: string;
  role: string;
  customStatus: string;
  isOnline: boolean;
  serverNickname?: string;
}

interface MemberListProps {
  serverID: string;
}

interface UserDetails {
  displayName: string;
  username: string;
  profilePicture: string;
  userId: string;
  customStatus: string;
  isOnline: boolean;
  serverNickname?: string;
}

const MemberList: React.FC<MemberListProps> = ({ serverID }) => {
  const { currentUser } = useAuth();
  const [owner, setOwner] = useState<Member | null>(null);
  const [admins, setAdmins] = useState<Member[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [offlineMembers, setOfflineMembers] = useState<Member[]>([]);
  const [selectedMember, setSelectedMember] = useState<UserDetails | null>(null);
  const [isFriend, setIsFriend] = useState<boolean>(false);
  const [isBlocked, setIsBlocked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [dmMessage, setDmMessage] = useState<string>('');
  const [serverNickname, setServerNickname] = useState<string>('');

  const defaultProfilePicture = "https://cdn.discordapp.com/embed/avatars/0.png";

  useEffect(() => {
    const fetchMembers = async () => {
      setLoading(true);
      const membersCollection = collection(db, 'Servers', serverID, 'Members');
      const unsubscribe = onSnapshot(membersCollection, async (snapshot) => {
        const membersList: Member[] = [];
        const adminsList: Member[] = [];
        const offlineList: Member[] = [];
        let ownerData: Member | null = null;

        for (const memberDoc of snapshot.docs) {
          const memberData = memberDoc.data() as { userId: string; role: string };
          const userDoc = await getDoc(doc(db, 'Users', memberData.userId));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const nicknamesCollection = collection(db, 'Users', memberData.userId, 'Nicknames');
            const nicknameQuery = query(nicknamesCollection, where('serverId', '==', serverID));
            const nicknameSnapshot = await getDocs(nicknameQuery);
            const nicknameData = nicknameSnapshot.docs[0]?.data() as { serverNickname?: string } | undefined;
            const member = {
              userId: memberData.userId,
              displayName: userData.displayName || 'Anonymous',
              profilePicture: userData.profilePicture || defaultProfilePicture,
              role: memberData.role,
              customStatus: userData.customStatus || (userData.isOnline ? 'Online' : 'Offline'),
              isOnline: userData.isOnline,
              serverNickname: nicknameData?.serverNickname,
            };

            if (member.isOnline) {
              if (memberData.role === 'owner') {
                ownerData = member;
              } else if (memberData.role === 'admin') {
                adminsList.push(member);
              } else {
                membersList.push(member);
              }
            } else {
              offlineList.push(member);
            }
          }
        }

        setOwner(ownerData);
        setAdmins(adminsList);
        setMembers(membersList);
        setOfflineMembers(offlineList);
        setLoading(false);
      });

      return () => unsubscribe();
    };

    fetchMembers();
  }, [serverID]);

  const handleMemberClick = async (userId: string) => {
    if (!currentUser) return;

    const userDoc = await getDoc(doc(db, 'Users', userId));
    if (userDoc.exists()) {
      const userData = userDoc.data();
      const nicknamesCollection = collection(db, 'Users', userId, 'Nicknames');
      const nicknameQuery = query(nicknamesCollection, where('serverId', '==', serverID));
      const nicknameSnapshot = await getDocs(nicknameQuery);
      const nicknameData = nicknameSnapshot.docs[0]?.data() as { serverNickname?: string } | undefined;

      setSelectedMember({
        displayName: userData.displayName,
        username: userData.username,
        profilePicture: userData.profilePicture || defaultProfilePicture,
        userId: userId,
        customStatus: userData.customStatus || (userData.isOnline ? 'Online' : 'Offline'),
        isOnline: userData.isOnline,
        serverNickname: nicknameData?.serverNickname,
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
        setServerNickname(nicknameData?.serverNickname || '');
      }
    }
  };

  const handleSendFriendRequest = async (userId: string) => {
    if (!currentUser) return;

    try {
      await addDoc(collection(db, 'FriendRequests'), {
        senderId: currentUser.uid,
        receiverId: userId,
        status: 'waiting',
      });
      alert('Friend request sent successfully');
    } catch (error) {
      console.error('Error sending friend request:', error);
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
      profilePicture: currentUser.profilePicture || defaultProfilePicture,
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

  const handleServerNicknameChange = async () => {
    if (!currentUser) return;

    try {
      const nicknamesCollection = collection(db, 'Users', currentUser.uid, 'Nicknames');
      const nicknameQuery = query(nicknamesCollection, where('serverId', '==', serverID));
      const nicknameSnapshot = await getDocs(nicknameQuery);
      if (!nicknameSnapshot.empty) {
        const nicknameDoc = nicknameSnapshot.docs[0];
        await updateDoc(nicknameDoc.ref, { serverNickname });
      } else {
        await addDoc(nicknamesCollection, { serverId: serverID, serverNickname });
      }
      if (selectedMember) {
        setSelectedMember({ ...selectedMember, serverNickname });
      }
    } catch (error) {
      console.error('Error updating server nickname:', error);
    }
  };

  return (
    <div className="bg-[--secondary-bg-color] text-purple-lighter flex-none w-64 pb-6 hidden md:block relative">
      <div className="text-[--primary-text-color] mb-4 mt-3 px-4 flex justify-between border-b border-gray-600 py-1 shadow-xl">
        <div className="flex-auto">
          <h1 className="font-semibold text-xl leading-tight mb-3 truncate">Members</h1>
        </div>
      </div>
      <div className="mb-4 px-4 text-left">
        {loading ? (
          <p className="text-[--secondary-text-color] text-center">Loading member list...</p>
        ) : (
          <>
            {owner && (
              <>
                <h1 className="text-[--secondary-text-color] font-semibold text-left mb-2 text-sm">OWNER</h1>
                <div className="flex items-center mb-2 cursor-pointer" onClick={() => handleMemberClick(owner.userId)}>
                  <img src={owner.profilePicture} alt="Owner" className="w-10 h-10 rounded-full mr-3" />
                  <div className="flex flex-col">
                    <span className="font-bold text-[--primary-text-color] text-left">{owner.serverNickname || owner.displayName}</span>
                    <span className="text-sm text-[--secondary-text-color] text-left">{owner.customStatus || (owner.isOnline ? "Online" : "Offline")}</span>
                  </div>
                </div>
              </>
            )}
            {admins.length > 0 && (
              <>
                <h1 className="text-[--secondary-text-color] font-semibold text-left mt-6 mb-2 text-sm">ADMINS</h1>
                {admins.map((admin) => (
                  <div key={admin.userId} className="flex items-center mb-2 cursor-pointer" onClick={() => handleMemberClick(admin.userId)}>
                    <img src={admin.profilePicture} alt="Admin" className="w-10 h-10 rounded-full mr-3" />
                    <div className="flex flex-col">
                      <span className="font-bold text-[--primary-text-color] text-left">{admin.serverNickname || admin.displayName}</span>
                      <span className="text-sm text-[--secondary-text-color] text-left">{admin.customStatus || (admin.isOnline ? "Online" : "Offline")}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
            {members.length > 0 && (
              <>
                <h1 className="text-[--secondary-text-color] font-semibold text-left mt-6 mb-2 text-sm">MEMBERS</h1>
                {members.map((member) => (
                  <div key={member.userId} className="flex items-center mb-2 cursor-pointer" onClick={() => handleMemberClick(member.userId)}>
                    <img src={member.profilePicture} alt="Member" className="w-10 h-10 rounded-full mr-3" />
                    <div className="flex flex-col">
                      <span className="font-bold text-[--primary-text-color] text-left">{member.serverNickname || member.displayName}</span>
                      <span className="text-sm text-[--secondary-text-color] text-left">{member.customStatus || (member.isOnline ? "Online" : "Offline")}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
            {offlineMembers.length > 0 && (
              <>
                <h1 className="text-[--secondary-text-color] font-semibold text-left mt-6 mb-2 text-sm">OFFLINE</h1>
                {offlineMembers.map((member) => (
                  <div key={member.userId} className="flex items-center mb-2 cursor-pointer" onClick={() => handleMemberClick(member.userId)}>
                    <img src={member.profilePicture} alt="Offline Member" className="w-10 h-10 rounded-full mr-3" />
                    <div className="flex flex-col">
                      <span className="font-bold text-[--primary-text-color] text-left">{member.serverNickname || member.displayName}</span>
                      <span className="text-sm text-[--secondary-text-color] text-left">{member.customStatus || "Offline"}</span>
                    </div>
                  </div>
                ))}
              </>
            )}
          </>
        )}
      </div>

      {selectedMember && (
        <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-[--primary-bg-color] rounded-lg p-4 max-w-md w-full">
            <h2 className="text-[--primary-text-color] text-xl font-bold mb-4">Profile Details</h2>
            <div className="flex items-center mb-4">
              <img src={selectedMember.profilePicture} alt="Profile" className="w-16 h-16 rounded-full mr-4" />
              <div className="flex flex-col">
                <span className="text-[--primary-text-color] text-lg font-bold">{selectedMember.serverNickname || selectedMember.displayName}</span>
                <span className="text-[--secondary-text-color]">@{selectedMember.username}</span>
              </div>
            </div>
            {selectedMember.userId === currentUser?.uid && (
              <div className="flex flex-col mb-4">
                <label className="text-[--primary-text-color] mb-2" htmlFor="serverNickname">Server Nickname</label>
                <input
                  type="text"
                  id="serverNickname"
                  className="w-full px-4 py-2 bg-[--secondary-bg-color] text-[--primary-text-color] rounded mb-2"
                  value={serverNickname}
                  onChange={(e) => setServerNickname(e.target.value)}
                />
                <button className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-[--primary-text-color] rounded" onClick={handleServerNicknameChange}>
                  Save Nickname
                </button>
              </div>
            )}
            {selectedMember.userId !== currentUser?.uid && (
              <div className="flex flex-col mb-4">
                {isFriend ? (
                  <button className="px-4 py-2 bg-green-500 text-[--primary-text-color] rounded mb-2" disabled>
                    Already Friends
                  </button>
                ) : (
                  <button className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-[--primary-text-color] rounded mb-2" onClick={() => handleSendFriendRequest(selectedMember.userId)}>
                    Send Friend Request
                  </button>
                )}
                {isBlocked ? (
                  <button className="px-4 py-2 bg-red-500 hover:bg-red-700 text-[--primary-text-color] rounded mb-2" onClick={() => handleUnblockUser(selectedMember.userId)}>
                    Unblock User
                  </button>
                ) : (
                  <button className="px-4 py-2 bg-red-500 hover:bg-red-700 text-[--primary-text-color] rounded mb-2" onClick={() => handleBlockUser(selectedMember.userId)}>
                    Block User
                  </button>
                )}
                <input
                  type="text"
                  className="w-full px-4 py-2 bg-gray-600 text-[--primary-text-color] rounded mb-2"
                  placeholder="Send a message"
                  value={dmMessage}
                  onChange={(e) => setDmMessage(e.target.value)}
                />
                <button className="px-4 py-2 bg-blue-500 hover:bg-blue-700 text-[--primary-text-color] rounded" onClick={handleSendMessage}>
                  Send Message
                </button>
              </div>
            )}
            <button className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-[--primary-text-color] rounded mt-2" onClick={() => setSelectedMember(null)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MemberList;

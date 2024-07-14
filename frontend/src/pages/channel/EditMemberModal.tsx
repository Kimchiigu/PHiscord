import React, { useEffect, useState } from 'react';
import { db } from '../../FirebaseConfig';
import { collection, getDocs, doc, updateDoc, deleteDoc, getDoc, query, where } from 'firebase/firestore';

interface EditMemberModalProps {
  show: boolean;
  serverID: string;
  onClose: () => void;
}

interface Member {
  id: string;
  userId: string;
  displayName: string;
  profileImage: string;
  role: 'owner' | 'admin' | 'member';
  serverNickname?: string;
}

interface UserData {
  displayName: string;
  profileImage: string;
}

const EditMemberModal: React.FC<EditMemberModalProps> = ({ show, serverID, onClose }) => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchMembers = async () => {
      const membersCollection = collection(db, 'Servers', serverID, 'Members');
      const membersSnapshot = await getDocs(membersCollection);
      const memberList = await Promise.all(
        membersSnapshot.docs.map(async (memberDoc) => {
          const memberData = memberDoc.data();
          const userDoc = await getDoc(doc(db, 'Users', memberData.userId));
          const userData = userDoc.data() as UserData | undefined;
          
          // Fetch serverNickname
          const nicknameQuery = query(collection(db, 'Users', memberData.userId, 'Nicknames'), where('serverId', '==', serverID));
          const nicknameSnapshot = await getDocs(nicknameQuery);
          const serverNickname = nicknameSnapshot.docs[0]?.data()?.serverNickname || '';
          
          return {
            id: memberDoc.id,
            userId: memberData.userId,
            displayName: userData?.displayName || '',
            profileImage: userData?.profileImage || 'https://cdn.discordapp.com/embed/avatars/0.png',
            role: memberData.role,
            serverNickname: serverNickname,
          };
        })
      );
      setMembers(memberList);
    };

    if (serverID) {
      fetchMembers();
    }
  }, [serverID]);

  const handlePromote = async (member: Member) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'Servers', serverID, 'Members', member.id), { role: 'admin' });
      refetchMembers();
    } catch (error) {
      console.error('Error promoting member:', error);
      alert('Failed to promote member. Please try again.');
    }
    setLoading(false);
  };

  const handleDemote = async (member: Member) => {
    setLoading(true);
    try {
      await updateDoc(doc(db, 'Servers', serverID, 'Members', member.id), { role: 'member' });
      refetchMembers();
    } catch (error) {
      console.error('Error demoting member:', error);
      alert('Failed to demote member. Please try again.');
    }
    setLoading(false);
  };

  const handleKick = async (member: Member) => {
    setLoading(true);
    try {
      await deleteDoc(doc(db, 'Servers', serverID, 'Members', member.id));
      refetchMembers();
    } catch (error) {
      console.error('Error kicking member:', error);
      alert('Failed to kick member. Please try again.');
    }
    setLoading(false);
  };

  const refetchMembers = async () => {
    const membersCollection = collection(db, 'Servers', serverID, 'Members');
    const membersSnapshot = await getDocs(membersCollection);
    const memberList = await Promise.all(
      membersSnapshot.docs.map(async (memberDoc) => {
        const memberData = memberDoc.data();
        const userDoc = await getDoc(doc(db, 'Users', memberData.userId));
        const userData = userDoc.data() as UserData | undefined;
        
        // Fetch serverNickname
        const nicknameQuery = query(collection(db, 'Users', memberData.userId, 'Nicknames'), where('serverId', '==', serverID));
        const nicknameSnapshot = await getDocs(nicknameQuery);
        const serverNickname = nicknameSnapshot.docs[0]?.data()?.serverNickname || '';

        return {
          id: memberDoc.id,
          userId: memberData.userId,
          displayName: userData?.displayName || '',
          profileImage: userData?.profileImage || 'https://cdn.discordapp.com/embed/avatars/0.png',
          role: memberData.role,
          serverNickname: serverNickname,
        };
      })
    );
    setMembers(memberList);
  };

  const handleSave = () => {
    window.location.reload();
  };

  if (!show) {
    return null;
  }

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-[--overlay-color] opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-[--primary-bg-color] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-[--primary-bg-color] px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="w-full">
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-[--primary-text-color]" id="modal-title">
                  Edit Members
                </h3>
                <div className="mt-2">
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-[--secondary-text-color]">Owner</h4>
                    {members.filter(member => member.role === 'owner').map(member => (
                      <div key={member.id} className="flex items-center justify-between p-2 border-b border-gray-300">
                        <div className="flex items-center">
                          <img src={member.profileImage} alt={member.displayName} className="w-8 h-8 rounded-full mr-2" />
                          <span className='text-[--primary-text-color]'>{member.serverNickname || member.displayName}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mb-4">
                    <h4 className="text-sm font-semibold text-[--secondary-text-color]">Admin</h4>
                    {members.filter(member => member.role === 'admin').map(member => (
                      <div key={member.id} className="flex items-center justify-between p-2 border-b border-gray-300">
                        <div className="flex items-center">
                          <img src={member.profileImage} alt={member.displayName} className="w-8 h-8 rounded-full mr-2" />
                          <span className='text-[--primary-text-color]'>{member.serverNickname || member.displayName}</span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="px-2 py-1 text-xs bg-yellow-500 text-white rounded"
                            onClick={() => handleDemote(member)}
                          >
                            Demote
                          </button>
                          <button
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                            onClick={() => handleKick(member)}
                          >
                            Kick
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-[--secondary-text-color]">Members</h4>
                    {members.filter(member => member.role === 'member').map(member => (
                      <div key={member.id} className="flex items-center justify-between p-2 border-b border-gray-300 w-full">
                        <div className="flex items-center">
                          <img src={member.profileImage} alt={member.displayName} className="w-8 h-8 rounded-full mr-2" />
                          <span className='text-[--primary-text-color]'>{member.serverNickname || member.displayName}</span>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            className="px-2 py-1 text-xs bg-green-500 text-white rounded"
                            onClick={() => handlePromote(member)}
                          >
                            Promote
                          </button>
                          <button
                            className="px-2 py-1 text-xs bg-red-500 text-white rounded"
                            onClick={() => handleKick(member)}
                          >
                            Kick
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[--primary-bg-color] px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button
              type="button"
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-[--safe-color] text-base font-medium text-white hover:bg-[--safe-color] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={handleSave}
              disabled={loading}
            >
              Save
            </button>
            <button
              type="button"
              className="mt-3 w-full inline-flex justify-center rounded-md  shadow-sm px-4 py-2 bg-[--primary-button-color] text-base font-medium text-[--primary-text-color] hover:bg-[--primary-button-hover] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
              onClick={onClose}
              disabled={loading}
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditMemberModal;

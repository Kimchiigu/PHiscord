import React, { useEffect, useState } from 'react';
import { db } from './firebaseConfig';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';

interface Member {
  userId: string;
  displayName: string;
  profilePicture: string;
  role: string;
}

interface MemberListProps {
  serverID: string;
}

const MemberList: React.FC<MemberListProps> = ({ serverID }) => {
  const [owner, setOwner] = useState<Member | null>(null);
  const [admins, setAdmins] = useState<Member[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

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

  return (
    <div className="bg-gray-800 text-purple-lighter flex-none w-64 pb-6 hidden md:block relative">
      <div className="text-white mb-2 mt-3 px-4 flex justify-between border-b border-gray-600 py-1 shadow-xl">
        <div className="flex-auto">
          <h1 className="font-semibold text-xl leading-tight mb-1 truncate">Members</h1>
        </div>
      </div>
      <div className="mb-4 px-4">
        {loading ? (
          <p className="text-gray-400">Loading member list...</p>
        ) : (
          <>
            <h1 className="text-gray-400 font-semibold text-left mb-2 text-sm">OWNER</h1>
            {owner ? (
              <div className="flex items-center mb-2">
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
                <div key={admin.userId} className="flex items-center mb-2">
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
                <div key={member.userId} className="flex items-center mb-2">
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
    </div>
  );
};

export default MemberList;

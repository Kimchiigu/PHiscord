import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
import ProfileBar from '../ProfileBar';
import CreateChannelModal from './CreateChannelModal';
import { useAuth } from '../provider/AuthProvider';
import InvitePeopleModal from './InvitePeopleModal';
import DeleteServerModal from './DeleteServerModal';
import LeaveServerModal from './LeaveServerModal';
import EditServerModal from './EditServerModal';
import EditMemberModal from './EditMemberModal';

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
}

interface ChannelListProps {
  serverID: string;
  serverName: string;
  serverImage: string;
  isOwner: boolean;
  isAdmin: boolean;
  onChannelSelect: (id: string, name: string) => void;
}

const ChannelList: React.FC<ChannelListProps> = ({
  serverID,
  serverName,
  serverImage,
  isOwner,
  isAdmin,
  onChannelSelect,
}) => {
  const { currentUser } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showLeaveModal, setShowLeaveModal] = useState(false);
  const [showEditServerModal, setShowEditServerModal] = useState(false);
  const [showEditMemberModal, setShowEditMemberModal] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [inviteLink, setInviteLink] = useState('');
  const [currentServerName, setCurrentServerName] = useState(serverName);
  const [currentServerImage, setCurrentServerImage] = useState(serverImage);
  const [currentRole, setCurrentRole] = useState<'owner' | 'admin' | 'member' | null>(null);

  useEffect(() => {
    const fetchChannels = async () => {
      const channelsCollection = collection(db, 'Servers', serverID, 'Channels');
      const channelSnapshot = await getDocs(channelsCollection);
      const channelList = channelSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Channel[];
      setChannels(channelList);
    };

    if (serverID) {
      fetchChannels();
    }
  }, [serverID]);

  useEffect(() => {
    setCurrentServerName(serverName);
    setCurrentServerImage(serverImage);
    const fetchUserRole = async () => {
      if (!currentUser) return;
      const membersCollection = collection(db, 'Servers', serverID, 'Members');
      const membersSnapshot = await getDocs(membersCollection);
      const memberDoc = membersSnapshot.docs.find((doc) => doc.data().userId === currentUser.uid);
      if (memberDoc) {
        const memberData = memberDoc.data();
        setCurrentRole(memberData.role as 'owner' | 'admin' | 'member');
      } else {
        setCurrentRole(null);
      }
    };
    fetchUserRole();
  }, [serverID, serverName, serverImage, currentUser]);

  const handleChannelCreated = async () => {
    const channelsCollection = collection(db, 'Servers', serverID, 'Channels');
    const channelSnapshot = await getDocs(channelsCollection);
    const channelList = channelSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Channel[];
    setChannels(channelList);
  };

  const handleCopyInviteLink = () => {
    navigator.clipboard.writeText(inviteLink).then(() => {
      // Show toast notification
      alert('Invite link copied to clipboard');
    });
  };

  const generateInviteLink = async () => {
    // Fetch invite link from the database
    const serverDoc = await getDoc(doc(db, 'Servers', serverID));
    if (serverDoc.exists()) {
      setInviteLink(serverDoc.data().inviteLink);
      setShowInviteModal(true);
    }
  };

  const handleLeaveServer = async () => {
    if (!currentUser) return;

    try {
      // Fetch all member documents to find the unique document ID
      const membersCollection = collection(db, 'Servers', serverID, 'Members');
      const membersSnapshot = await getDocs(membersCollection);
      const memberDoc = membersSnapshot.docs.find((doc) => doc.data().userId === currentUser.uid);

      if (memberDoc) {
        await deleteDoc(memberDoc.ref);
        setShowLeaveModal(false);
        // Refresh the server list or redirect the user
        window.location.reload();
      } else {
        alert('Failed to leave server. Member not found.');
      }
    } catch (error) {
      console.error('Error leaving server:', error);
      alert('Failed to leave server. Please try again.');
    }
  };

  const handleDeleteServer = async (serverName: string) => {
    if (!serverID) return;

    const serverDocRef = doc(db, 'Servers', serverID);
    try {
      await deleteDoc(serverDocRef);
      setShowDeleteModal(false);
      alert(`${serverName} has been successfully deleted.`);
      // Refresh the server list or redirect the user
      window.location.reload();
    } catch (error) {
      console.error('Error deleting server:', error);
      alert('Failed to delete server. Please try again.');
    }
  };

  const handleEditServerProfile = () => {
    setShowEditServerModal(true);
  };

  const handleEditMemberSettings = () => {
    setShowEditMemberModal(true);
  };

  const handleSaveServerDetails = (name: string, imageUrl: string) => {
    setCurrentServerName(name);
    setCurrentServerImage(imageUrl);
    window.location.reload();
  };

  return (
    <div className="bg-gray-800 text-purple-lighter flex-none w-64 pb-6 hidden md:block relative">
      <div className="text-white mb-2 mt-3 px-4 flex justify-between border-b border-gray-600 py-1 shadow-xl">
        <div className="flex-auto cursor-pointer" onClick={() => setShowDropdown(!showDropdown)}>
          <h1 className="font-semibold text-xl leading-tight mb-1 truncate">{currentServerName}</h1>
        </div>
        {showDropdown && (
          <div className="absolute top-14 left-0 bg-gray-700 border border-gray-600 rounded-lg shadow-lg min-w-60 z-10 ml-2">
            <div className="p-2">
              <div className="hover:bg-gray-600 p-2 cursor-pointer" onClick={generateInviteLink}>
                Invite People
              </div>
              {(currentRole === 'owner' || currentRole === 'admin') && (
                <div className="hover:bg-gray-600 p-2 cursor-pointer" onClick={handleEditServerProfile}>
                  Edit Server Profile
                </div>
              )}
              {currentRole === 'owner' && (
                <div className="hover:bg-gray-600 p-2 cursor-pointer" onClick={handleEditMemberSettings}>
                  Edit Member Settings
                </div>
              )}
              {currentRole !== 'owner' && (
                <div className="hover:bg-gray-600 p-2 cursor-pointer text-red-500" onClick={() => setShowLeaveModal(true)}>
                  Leave Server
                </div>
              )}
              {currentRole === 'owner' && (
                <div className="hover:bg-gray-600 p-2 cursor-pointer text-red-500" onClick={() => setShowDeleteModal(true)}>
                  Delete Server
                </div>
              )}
            </div>
          </div>
        )}
      </div>
      <div className="mb-8">
        <div className="px-4 mb-2 text-white flex justify-between items-center">
          <div className="opacity-75 cursor-pointer">TEXT CHANNELS</div>
          {(currentRole === 'owner' || currentRole === 'admin') && (
            <div>
              <svg
                onClick={() => setShowCreateChannelModal(true)}
                className="fill-current h-5 w-5 opacity-50 cursor-pointer"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path
                  d="M16 10c0 .553-.048 1-.601 1H11v4.399c0 .552-.447.601-1 .601-.553 0-1-.049-1-.601V11H4.601C4.049 11 4 10.553 4 10c0-.553.049-1 .601-1H9V4.601C9 4.048 9.447 4 10 4c.553 0 1 .048 1 .601V9h4.399c.553 0 .601.447.601 1z"
                />
              </svg>
            </div>
          )}
        </div>
        {channels
          .filter((channel) => channel.type === 'text')
          .map((channel) => (
            <div
              key={channel.id}
              className="bg-teal-dark cursor-pointer font-semibold py-1 px-4 text-gray-300 text-left"
              onClick={() => onChannelSelect(channel.id, channel.name)}
            >
              # {channel.name}
            </div>
          ))}
      </div>
      <div className="mb-8">
        <div className="px-4 mb-2 text-white flex justify-between items-center">
          <div className="opacity-75 cursor-pointer">VOICE CHANNELS</div>
          {(currentRole === 'owner' || currentRole === 'admin') && (
            <div>
              <svg
                onClick={() => setShowCreateChannelModal(true)}
                className="fill-current h-5 w-5 opacity-50 cursor-pointer"
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
              >
                <path
                  d="M16 10c0 .553-.048 1-.601 1H11v4.399c0 .552-.447.601-1 .601-.553 0-1-.049-1-.601V11H4.601C4.049 11 4 10.553 4 10c0-.553.049-1 .601-1H9V4.601C9 4.048 9.447 4 10 4c.553 0 1 .048 1 .601V9h4.399c.553 0 .601.447.601 1z"
                />
              </svg>
            </div>
          )}
        </div>
        {channels
          .filter((channel) => channel.type === 'voice')
          .map((channel) => (
            <div
              key={channel.id}
              className="bg-teal-dark hover:bg-gray-800 cursor-pointer font-semibold py-1 px-4 text-gray-300 text-left"
              onClick={() => onChannelSelect(channel.id, channel.name)}
            >
              # {channel.name}
            </div>
          ))}
      </div>

      {showCreateChannelModal && (
        <CreateChannelModal
          show={showCreateChannelModal}
          serverID={serverID}
          onClose={() => setShowCreateChannelModal(false)}
          onChannelCreated={handleChannelCreated}
        />
      )}

      {showInviteModal && (
        <InvitePeopleModal
          show={showInviteModal}
          serverName={currentServerName}
          inviteLink={inviteLink}
          onClose={() => setShowInviteModal(false)}
          onCopy={handleCopyInviteLink}
        />
      )}

      {showDeleteModal && (
        <DeleteServerModal
          show={showDeleteModal}
          serverName={currentServerName}
          onClose={() => setShowDeleteModal(false)}
          onDelete={() => handleDeleteServer(currentServerName)}
        />
      )}

      {showLeaveModal && (
        <LeaveServerModal
          show={showLeaveModal}
          serverName={currentServerName}
          onClose={() => setShowLeaveModal(false)}
          onLeave={handleLeaveServer}
        />
      )}

      {showEditServerModal && (
        <EditServerModal
          show={showEditServerModal}
          serverID={serverID}
          serverName={currentServerName}
          serverImage={currentServerImage}
          onClose={() => setShowEditServerModal(false)}
          onSave={handleSaveServerDetails}
        />
      )}

      {showEditMemberModal && (
        <EditMemberModal
          show={showEditMemberModal}
          serverID={serverID}
          onClose={() => setShowEditMemberModal(false)}
        />
      )}

      <ProfileBar />
    </div>
  );
};

export default ChannelList;

import React, { useEffect, useState } from 'react';
import { db } from '../FirebaseConfig';
import { collection, getDocs, doc, deleteDoc, getDoc, onSnapshot } from 'firebase/firestore';
import ProfileBar from '../ProfileBar';
import CreateChannelModal from './CreateChannelModal';
import EditChannelModal from './EditChannelModal';
import DeleteChannelModal from './DeleteChannelModal';
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
  nsfw?: boolean;
}

interface ChannelListProps {
  serverID: string;
  serverName: string;
  serverImage: string;
  isOwner: boolean;
  isAdmin: boolean;
  onChannelSelect: (id: string, name: string, nsfw: boolean) => void;
  onVoiceChannelSelect: (id: string, name: string) => void;
}

interface Participant {
  uid: string;
  username: string;
  profilePicture: string | null;
}

const ChannelList: React.FC<ChannelListProps> = ({
  serverID,
  serverName,
  serverImage,
  onChannelSelect,
  onVoiceChannelSelect,
}) => {
  const { currentUser } = useAuth();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [participants, setParticipants] = useState<{ [key: string]: Participant[] }>({});
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);
  const [showEditChannelModal, setShowEditChannelModal] = useState<{ show: boolean; channelID: string }>({ show: false, channelID: '' });
  const [showDeleteChannelModal, setShowDeleteChannelModal] = useState<{ show: boolean; channelID: string; channelName: string }>({ show: false, channelID: '', channelName: '' });
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

  useEffect(() => {
    channels.forEach(channel => {
      if (channel.type === 'voice') {
        const channelDocRef = doc(db, 'Servers', serverID, 'Channels', channel.id);
        onSnapshot(channelDocRef, async (channelDoc) => {
          if (channelDoc.exists()) {
            const participantsData = channelDoc.data().participants || [];
            const participantsWithProfilePictures = await Promise.all(
              participantsData.map(async (uid: string) => {
                const userDoc = await getDoc(doc(db, 'Users', uid));
                if (userDoc.exists()) {
                  const profilePicturePath = userDoc.data()?.profilePicture;
                  const username = userDoc.data()?.username;
                  return {
                    uid,
                    username,
                    profilePicture: profilePicturePath || null,
                  };
                }
                return { uid, username: 'Unknown', profilePicture: null };
              })
            );
            setParticipants(prev => ({ ...prev, [channel.id]: participantsWithProfilePictures }));
          }
        });
      }
    });
  }, [channels, serverID]);

  const handleChannelCreated = async () => {
    const channelsCollection = collection(db, 'Servers', serverID, 'Channels');
    const channelSnapshot = await getDocs(channelsCollection);
    const channelList = channelSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Channel[];
    setChannels(channelList);
  };

  const handleChannelUpdated = async () => {
    const channelsCollection = collection(db, 'Servers', serverID, 'Channels');
    const channelSnapshot = await getDocs(channelsCollection);
    const channelList = channelSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as Channel[];
    setChannels(channelList);
  };

  const handleChannelDeleted = async () => {
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
    <div className="bg-[--secondary-bg-color] text-purple-lighter flex-none w-64 pb-6 hidden md:block relative">
      <div className="text-[--primary-text-color] mb-2 mt-3 px-4 flex justify-between border-b border-gray-600 py-1 shadow-xl">
        <div className="flex-auto cursor-pointer" onClick={() => setShowDropdown(!showDropdown)}>
          <h1 className="font-semibold text-xl leading-tight mb-3 truncate">{currentServerName}</h1>
        </div>
        {showDropdown && (
          <div className="absolute top-14 left-0 bg-[--primary-bg-color] border border-gray-600 rounded-lg shadow-lg min-w-60 z-10 ml-2">
            <div className="p-2">
              <div className="hover:bg-gray-600 p-2 cursor-pointer text-[--primary-text-color]" onClick={generateInviteLink}>
                Invite People
              </div>
              {(currentRole === 'owner' || currentRole === 'admin') && (
                <div className="hover:bg-gray-600 p-2 cursor-pointer text-[--primary-text-color]" onClick={handleEditServerProfile}>
                  Edit Server Profile
                </div>
              )}
              {currentRole === 'owner' && (
                <div className="hover:bg-gray-600 p-2 cursor-pointer text-[--primary-text-color]" onClick={handleEditMemberSettings}>
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
        <div className="px-4 mb-2 text-[--primary-text-color] flex justify-between items-center">
          <div className="opacity-75 cursor-pointer mt-2">TEXT CHANNELS</div>
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
              className="mx-2 rounded-md group relative bg-teal-dark hover:bg-[--primary-bg-color] cursor-pointer font-semibold py-1 px-4 text-[--primary-text-color] text-left flex justify-between items-center"
              onClick={() => onChannelSelect(channel.id, channel.name, channel.nsfw || false)}
            >
              <span># {channel.name}</span>
              {(currentRole === 'owner' || currentRole === 'admin') && (
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100">
                  <svg
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEditChannelModal({ show: true, channelID: channel.id });
                    }}
                    className="fill-current h-4 w-4 cursor-pointer"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M12.586 2.586a2 2 0 00-2.828 0l-7 7a2 2 0 000 2.828l7 7a2 2 0 002.828 0l7-7a2 2 0 000-2.828l-7-7zm1.414 9.414L11 14.586l-3-3 3-3 3 3z"
                    />
                  </svg>
                  <svg
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowDeleteChannelModal({ show: true, channelID: channel.id, channelName: channel.name });
                    }}
                    className="fill-current h-4 w-4 cursor-pointer"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                  >
                    <path
                      d="M6 2a2 2 0 00-2 2v1H3a1 1 0 000 2h1v9a2 2 0 002 2h8a2 2 0 002-2V7h1a1 1 0 000-2h-1V4a2 2 0 00-2-2H6zm2 5a1 1 0 012 0v7a1 1 0 01-2 0V7zm4 0a1 1 0 012 0v7a1 1 0 01-2 0V7z"
                    />
                  </svg>
                </div>
              )}
            </div>
          ))}
      </div>
      <div className="mb-8">
        <div className="px-4 mb-2 text-[--primary-text-color] flex justify-between items-center">
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
            <div key={channel.id}>
              <div
                className="mx-2 rounded-md group relative bg-teal-dark hover:bg-[--primary-bg-color] cursor-pointer font-semibold py-1 px-4 text-[--primary-text-color] text-left flex justify-between items-center"
                onClick={() => onVoiceChannelSelect(channel.id, channel.name)}
              >
                <span># {channel.name}</span>
                {(currentRole === 'owner' || currentRole === 'admin') && (
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100">
                    <svg
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEditChannelModal({ show: true, channelID: channel.id });
                      }}
                      className="fill-current h-4 w-4 cursor-pointer"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M12.586 2.586a2 2 0 00-2.828 0l-7 7a2 2 0 000 2.828l7 7a2 2 0 002.828 0l7-7a2 2 0 000-2.828l-7-7zm1.414 9.414L11 14.586l-3-3 3-3 3 3z"
                      />
                    </svg>
                    <svg
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowDeleteChannelModal({ show: true, channelID: channel.id, channelName: channel.name });
                      }}
                      className="fill-current h-4 w-4 cursor-pointer"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                    >
                      <path
                        d="M6 2a2 2 0 00-2 2v1H3a1 1 0 000 2h1v9a2 2 0 002 2h8a2 2 0 002-2V7h1a1 1 0 000-2h-1V4a2 2 0 00-2-2H6zm2 5a1 1 0 012 0v7a1 1 0 01-2 0V7zm4 0a1 1 0 012 0v7a1 1 0 01-2 0V7z"
                      />
                    </svg>
                  </div>
                )}
              </div>
              <div className="pl-8">
                {participants[channel.id] && participants[channel.id].length > 0 ? (
                  participants[channel.id].map((participant) => (
                    <div key={participant.uid} className="flex items-center space-x-2 py-1">
                      {participant.profilePicture ? (
                        <img src={participant.profilePicture} alt="Profile" className="w-8 h-8 rounded-full" />
                      ) : (
                        <div className="w-8 h-8 bg-gray-700 rounded-full"></div>
                      )}
                      <span className="text-[--primary-text-color]">{participant.username}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-gray-500 italic"></div>
                )}
              </div>
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

      {showEditChannelModal.show && (
        <EditChannelModal
          show={showEditChannelModal.show}
          serverID={serverID}
          channelID={showEditChannelModal.channelID}
          onClose={() => setShowEditChannelModal({ show: false, channelID: '' })}
          onChannelUpdated={handleChannelUpdated}
        />
      )}

      {showDeleteChannelModal.show && (
        <DeleteChannelModal
          show={showDeleteChannelModal.show}
          serverID={serverID}
          channelID={showDeleteChannelModal.channelID}
          channelName={showDeleteChannelModal.channelName}
          onClose={() => setShowDeleteChannelModal({ show: false, channelID: '', channelName: '' })}
          onChannelDeleted={handleChannelDeleted}
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

import React, { useEffect, useState } from 'react';
import { db } from '../firebaseConfig';
import { collection, getDocs } from 'firebase/firestore';
import ProfileBar from '../ProfileBar';
import CreateChannelModal from './CreateChannelModal';

interface Channel {
  id: string;
  name: string;
  type: 'text' | 'voice';
}

interface ChannelListProps {
  serverID: string;
  serverName: string;
  isOwner: boolean;
  onChannelSelect: (id: string, name: string) => void;
}

const ChannelList: React.FC<ChannelListProps> = ({ serverID, serverName, isOwner, onChannelSelect }) => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [showCreateChannelModal, setShowCreateChannelModal] = useState(false);

  useEffect(() => {
    const fetchChannels = async () => {
      const channelsCollection = collection(db, 'Servers', serverID, 'Channels');
      const channelSnapshot = await getDocs(channelsCollection);
      const channelList = channelSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Channel[];
      setChannels(channelList);
    };

    if (serverID) {
      fetchChannels();
    }
  }, [serverID]);

  const handleChannelCreated = async () => {
    const channelsCollection = collection(db, 'Servers', serverID, 'Channels');
    const channelSnapshot = await getDocs(channelsCollection);
    const channelList = channelSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    })) as Channel[];
    setChannels(channelList);
  };

  return (
    <div className="bg-gray-800 text-purple-lighter flex-none w-64 pb-6 hidden md:block relative">
      <div className="text-white mb-2 mt-3 px-4 flex justify-between border-b border-gray-600 py-1 shadow-xl">
        <div className="flex-auto">
          <h1 className="font-semibold text-xl leading-tight mb-1 truncate">{serverName}</h1>
        </div>
      </div>
      <div className="mb-8">
        <div className="px-4 mb-2 text-white flex justify-between items-center">
          <div className="opacity-75 cursor-pointer">TEXT CHANNELS</div>
          {isOwner && (
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
        {channels.filter(channel => channel.type === 'text').map(channel => (
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
          {isOwner && (
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
        {channels.filter(channel => channel.type === 'voice').map(channel => (
          <div
            key={channel.id}
            className="bg-teal-dark hover:bg-gray-800 cursor-pointer font-semibold py-1 px-4 text-gray-300  text-left"
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

      <ProfileBar />
    </div>
  );
};

export default ChannelList;

import React, { useState } from 'react';
import '../App.css';
import Sidebar from './Sidebar';
import ChannelList from './channel/ChannelList';
import MemberList from './MemberList';
import Chat from './Chat';

const Dashboard: React.FC = () => {
  const [selectedServer, setSelectedServer] = useState<{ id: string; name: string; isOwner: boolean } | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<{ id: string; name: string } | null>(null);

  return (
    <div className="font-sans antialiased h-screen flex w-full">
      <Sidebar onServerSelect={(id, name, isOwner) => {
        setSelectedServer({ id, name, isOwner });
        setSelectedChannel(null); // Reset channel selection when server changes
      }} />
      {selectedServer ? (
        <>
          <ChannelList
            serverID={selectedServer.id}
            serverName={selectedServer.name}
            isOwner={selectedServer.isOwner}
            onChannelSelect={(id, name) => setSelectedChannel({ id, name })}
          />
          {selectedChannel ? (
            <>
              <Chat channelID={selectedChannel.id} channelName={selectedChannel.name} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-700">
              <h2 className="text-gray-400">Select a channel to start chatting</h2>
            </div>
          )}
          <MemberList serverID={selectedServer.id}  />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-700">
          <h2 className="text-gray-400">Choose a server to get started</h2>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

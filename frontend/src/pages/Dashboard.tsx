import React, { useState } from 'react';
import '../App.css';
import Sidebar from './Sidebar';
import ChannelList from './channel/ChannelList';
import MemberList from './MemberList';
import Chat from './Chat';
import FriendList from './friend/FriendList';
import FriendChat from './friend/FriendChat';
import FriendProfile from './friend/FriendProfile'; // Assuming this component exists

const Dashboard: React.FC = () => {
  const [selectedServer, setSelectedServer] = useState<{ id: string; name: string; isOwner: boolean } | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<{ id: string; name: string } | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<{ userId: string; displayName: string } | null>(null);

  return (
    <div className="font-sans antialiased h-screen flex w-full">
      <Sidebar
        onServerSelect={(id, name, isOwner) => {
          setSelectedServer({ id, name, isOwner });
          setSelectedChannel(null); // Reset channel selection when server changes
          setSelectedFriend(null); // Reset friend selection when server changes
        }}
        onFriendSelect={(friend) => {
          setSelectedServer(null); // Reset server selection when friend is selected
          setSelectedChannel(null); // Reset channel selection when friend is selected
          setSelectedFriend(friend);
        }}
      />
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
              <Chat
                serverID={selectedServer.id}
                channelID={selectedChannel.id}
                channelName={selectedChannel.name}
              />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-700">
              <h2 className="text-gray-400">Select a channel to start chatting</h2>
            </div>
          )}
          <MemberList serverID={selectedServer.id} />
        </>
      ) : selectedFriend ? (
        <>
          <FriendList onFriendSelect={(friend) => setSelectedFriend(friend)} />
          <FriendChat friendId={selectedFriend.userId} />
          <FriendProfile friendId={selectedFriend.userId} />
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-700">
          <h2 className="text-gray-400">Choose a server or friend to get started</h2>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

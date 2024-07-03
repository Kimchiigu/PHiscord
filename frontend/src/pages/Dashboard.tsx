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
  const [dmSelected, setDmSelected] = useState<boolean>(false);

  return (
    <div className="font-sans antialiased h-screen flex w-full">
      <Sidebar
        onServerSelect={(id, name, isOwner) => {
          setSelectedServer({ id, name, isOwner });
          setSelectedChannel(null); // Reset channel selection when server changes
          setSelectedFriend(null); // Reset friend selection when server changes
          setDmSelected(false); // Reset DM selection when server changes
        }}
        onDmSelect={() => {
          setSelectedServer(null); // Reset server selection when DM is selected
          setSelectedChannel(null); // Reset channel selection when DM is selected
          setSelectedFriend(null); // Reset friend selection when DM is selected
          setDmSelected(true); // Set DM selection when DM is selected
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
      ) : dmSelected ? (
        <div className="flex flex-1 overflow-hidden">
          <FriendList onFriendSelect={(friend) => setSelectedFriend(friend)} />
          {selectedFriend ? (
            <>
              <FriendChat friendId={selectedFriend.userId} friendName={selectedFriend.displayName} />
              <FriendProfile friendId={selectedFriend.userId} />
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-700">
              <h2 className="text-gray-400">Choose a friend to get started chatting</h2>
            </div>
          )}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center bg-gray-700">
          <h2 className="text-gray-400">Choose a server or friend to get started</h2>
        </div>
      )}
    </div>
  );
};

export default Dashboard;

import React, { useState } from 'react';
import '../App.css';
import Sidebar from './Sidebar';
import ChannelList from './channel/ChannelList';
import MemberList from './MemberList';
import Chat from './Chat';
import FriendList from './friend/FriendList';
import FriendChat from './friend/FriendChat';
import FriendProfile from './friend/FriendProfile';
import FriendCategory from './friend/FriendCategory';
import VoiceChannel from './channel/VoiceChannel'; // Import the VoiceChannel component

const Dashboard: React.FC = () => {
  const [selectedServer, setSelectedServer] = useState<{ id: string; name: string; isOwner: boolean } | null>(null);
  const [selectedChannel, setSelectedChannel] = useState<{ id: string; name: string; type: 'text' | 'voice' } | null>(null);
  const [selectedFriend, setSelectedFriend] = useState<{ userId: string; displayName: string } | null>(null);
  const [dmSelected, setDmSelected] = useState<boolean>(false);
  const [selectedTab, setSelectedTab] = useState<'friends' | 'online' | 'all' | 'pending' | 'blocked' | 'addFriend'>('friends');
  const [categorySelected, setCategorySelected] = useState<boolean>(false);

  return (
    <div className="font-sans antialiased h-screen flex w-full">
      <Sidebar
        onServerSelect={(id, name, isOwner) => {
          setSelectedServer({ id, name, isOwner });
          setSelectedChannel(null);
          setSelectedFriend(null);
          setDmSelected(false);
          setCategorySelected(false);
        }}
        onDmSelect={() => {
          setSelectedServer(null);
          setSelectedChannel(null);
          setSelectedFriend(null);
          setDmSelected(true);
          setCategorySelected(false);
        }}
      />
      {selectedServer ? (
        <>
          <ChannelList
            serverID={selectedServer.id}
            serverName={selectedServer.name}
            isOwner={selectedServer.isOwner}
            onChannelSelect={(id, name, nsfw) => setSelectedChannel({ id, name, type: 'text' })}
            onVoiceChannelSelect={(id, name) => setSelectedChannel({ id, name, type: 'voice' })}
          />
          {selectedChannel ? (
            selectedChannel.type === 'text' ? (
              <Chat
                serverID={selectedServer.id}
                channelID={selectedChannel.id}
                channelName={selectedChannel.name}
              />
            ) : (
              <VoiceChannel
                serverID={selectedServer.id}
                channelID={selectedChannel.id}
                channelName={selectedChannel.name}
              />
            )
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-700">
              <h2 className="text-gray-400">Select a channel to start chatting</h2>
            </div>
          )}
          <MemberList serverID={selectedServer.id} />
        </>
      ) : dmSelected ? (
        <div className="flex flex-1 overflow-hidden">
          <FriendList
            onFriendSelect={(friend) => {
              setSelectedFriend(friend);
              setCategorySelected(false);  // Reset category selection when a friend is selected
            }}
            onCategorySelect={() => setCategorySelected(true)}
          />
          {categorySelected ? (
            <FriendCategory selectedTab={selectedTab} setSelectedTab={setSelectedTab} />
          ) : selectedFriend ? (
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

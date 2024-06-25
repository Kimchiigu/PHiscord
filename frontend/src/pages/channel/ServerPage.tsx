import React from 'react';
import ChannelList from './ChannelList';
import ProfileBar from '../ProfileBar';

const ServerPage: React.FC<{ serverId: string }> = ({ serverId }) => {
  return (
    <div className="flex">
      <ChannelList serverId={serverId} />
      <ProfileBar />
    </div>
  );
};

export default ServerPage;

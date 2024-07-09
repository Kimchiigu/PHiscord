import React from 'react';

interface FriendCategoryProps {
  selectedTab: string;
  setSelectedTab: (tab: string) => void;
}

const FriendCategory: React.FC<FriendCategoryProps> = ({ selectedTab, setSelectedTab }) => {
  return (
    <div className="bg-gray-800 text-purple-lighter flex-none w-full pb-6 md:block relative">
      <div className="text-white mb-2 mt-3 px-4 flex justify-between border-b border-gray-600 py-1 shadow-xl">
        <div className="flex-auto">
          <h1 className="font-semibold text-xl leading-tight mb-1 truncate">Friends</h1>
        </div>
      </div>
      <div className="flex space-x-2 px-4">
        <button className={`px-4 py-2 rounded ${selectedTab === 'friends' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-400'}`} onClick={() => setSelectedTab('friends')}>Friends</button>
        <button className={`px-4 py-2 rounded ${selectedTab === 'online' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-400'}`} onClick={() => setSelectedTab('online')}>Online</button>
        <button className={`px-4 py-2 rounded ${selectedTab === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-400'}`} onClick={() => setSelectedTab('all')}>All</button>
        <button className={`px-4 py-2 rounded ${selectedTab === 'pending' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-400'}`} onClick={() => setSelectedTab('pending')}>Pending</button>
        <button className={`px-4 py-2 rounded ${selectedTab === 'blocked' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-400'}`} onClick={() => setSelectedTab('blocked')}>Blocked</button>
        <button className={`px-4 py-2 rounded ${selectedTab === 'addFriend' ? 'bg-blue-500 text-white' : 'bg-gray-600 text-gray-400'}`} onClick={() => setSelectedTab('addFriend')}>Add Friend</button>
      </div>
    </div>
  );
};

export default FriendCategory;

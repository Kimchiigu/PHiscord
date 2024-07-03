import React from 'react';

interface FriendProfileProps {
  friend: {
    displayName: string;
    username: string;
    profilePicture: string;
  } | null;
}

const FriendProfile: React.FC<FriendProfileProps> = ({ friend }) => {
  if (!friend) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-700">
        <h2 className="text-gray-400">Select a friend to view their profile</h2>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 text-purple-lighter flex-none w-64 pb-6 hidden md:block relative">
      <div className="text-white mb-2 mt-3 px-4 flex justify-between border-b border-gray-600 py-1 shadow-xl">
        <div className="flex-auto">
          <h1 className="font-semibold text-xl leading-tight mb-1 truncate">{friend.displayName}</h1>
        </div>
      </div>
      <div className="mb-4 px-4 text-left">
        <div className="flex items-center mb-4">
          <img src={friend.profilePicture} alt="Profile" className="w-16 h-16 rounded-full mr-4" />
          <div className="flex flex-col">
            <span className="text-white text-lg font-bold">{friend.displayName}</span>
            <span className="text-gray-400">@{friend.email}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FriendProfile;

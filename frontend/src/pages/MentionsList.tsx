import React from 'react';

interface MentionsListProps {
  members: { id: string; displayName: string; profilePicture: string; serverNickname?: string }[];
  onSelect: (username: string) => void;
}

const MentionsList: React.FC<MentionsListProps> = ({ members, onSelect }) => {
  return (
    <div className="absolute bottom-20 bg-gray-600 p-2 rounded shadow-lg grid grid-cols-1 gap-2">
      {members.map(member => (
        <div
          key={member.id}
          className="text-white cursor-pointer flex items-center"
          onClick={() => onSelect(member.serverNickname || member.displayName)}
        >
          <img src={member.profilePicture} alt={`${member.displayName}'s avatar`} className="w-6 h-6 rounded-full mr-2" />
          {member.serverNickname || member.displayName}
        </div>
      ))}
      <div
        className="text-white cursor-pointer flex items-center"
        onClick={() => onSelect("everyone")}
      >
        everyone
      </div>
    </div>
  );
};

export default MentionsList;

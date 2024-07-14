import React from 'react';

interface InvitePeopleModalProps {
  show: boolean;
  serverName: string;
  inviteLink: string;
  onClose: () => void;
  onCopy: () => void;
}

const InvitePeopleModal: React.FC<InvitePeopleModalProps> = ({ show, serverName, inviteLink, onClose, onCopy }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-[--primary-bg-color] p-6 rounded-lg w-96">
        <h2 className="text-[--primary-text-color] text-2xl mb-4">Invite People to {serverName}</h2>
        <p className="text-[--secondary-text-color] mb-4">Invite your friends to hangout and chill in {serverName}</p>
        <div className="bg-[--secondary-bg-color] p-2 rounded-lg mb-4">
          <input
            type="text"
            readOnly
            value={inviteLink}
            className="bg-transparent text-[--primary-text-color] w-full focus:outline-none"
          />
        </div>
        <button
          onClick={onCopy}
          className="bg-[--primary-button-color] hover:bg-[--primary-button-hover] text-[--primary-text-color] py-2 px-4 rounded w-full"
        >
          Copy Link
        </button>
        <button
          onClick={onClose}
          className="mt-4 bg-[--danger-button] hover:bg-[--danger-button] text-[--primary-text-color] py-2 px-4 rounded w-full"
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default InvitePeopleModal;

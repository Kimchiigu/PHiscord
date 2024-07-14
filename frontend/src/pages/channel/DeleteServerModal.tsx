import React, { useState } from 'react';

interface DeleteServerModalProps {
  show: boolean;
  serverName: string;
  onClose: () => void;
  onDelete: () => void;
}

const DeleteServerModal: React.FC<DeleteServerModalProps> = ({ show, serverName, onClose, onDelete }) => {
  const [inputValue, setInputValue] = useState('');

  const handleDelete = () => {
    if (inputValue === serverName) {
      onDelete();
    } else {
      alert('Server name does not match');
    }
  };

  return (
    show && (
      <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-[--primary-bg-color] rounded-lg p-4 max-w-md w-full">
          <h2 className="text-[--primary-text-color] text-xl font-bold mb-4">Delete '{serverName}'</h2>
          <p className="text-[--warning-color] mb-4">Are you sure you want to delete {serverName}? This action cannot be undone.</p>
          <div className="mb-4">
            <label className="text-[--primary-text-color] mb-2 block">ENTER SERVER NAME</label>
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="w-full px-3 py-2 border border-gray-600 rounded-lg bg-[--secondary-bg-color] text-[--primary-text-color]"
            />
          </div>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-[--primary-button-color] hover:bg-[--primary-button-hover] text-[--primary-text-color] rounded mr-2"
            >
              Cancel
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2 bg-[--danger-button] hover:bg-red-600 text-[--primary-text-color] rounded"
            >
              Delete Server
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default DeleteServerModal;

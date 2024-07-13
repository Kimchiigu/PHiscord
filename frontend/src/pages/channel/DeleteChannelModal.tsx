import React from 'react';
import { db } from '../FirebaseConfig';
import { doc, deleteDoc } from 'firebase/firestore';

interface DeleteChannelModalProps {
  show: boolean;
  serverID: string;
  channelID: string;
  channelName: string;
  onClose: () => void;
  onChannelDeleted: () => void;
}

const DeleteChannelModal: React.FC<DeleteChannelModalProps> = ({ show, serverID, channelID, channelName, onClose, onChannelDeleted }) => {
  const handleDeleteChannel = async () => {
    const channelDoc = doc(db, 'Servers', serverID, 'Channels', channelID);
    await deleteDoc(channelDoc);
    onChannelDeleted();
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full dark:bg-gray-700">
          <div className="relative bg-white rounded-lg shadow dark:bg-gray-700">
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Delete Channel</h3>
              <button
                type="button"
                className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm h-8 w-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
                onClick={onClose}
              >
                <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                </svg>
                <span className="sr-only">Close modal</span>
              </button>
            </div>
            <div className="p-4 md:p-5">
              <p className="mb-4 text-gray-700 dark:text-gray-300">Are you sure you want to delete the channel <strong>{channelName}</strong>?</p>
              <div className="flex justify-end">
                <button
                  className="text-white inline-flex justify-center bg-red-700 hover:bg-red-800 focus:ring-4 focus:outline-none focus:ring-red-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-red-600 dark:hover:bg-red-700 dark:focus:ring-red-800 mr-2"
                  onClick={handleDeleteChannel}
                >
                  Delete
                </button>
                <button
                  className="text-gray-700 inline-flex justify-center bg-gray-300 hover:bg-gray-400 focus:ring-4 focus:outline-none focus:ring-gray-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-gray-600 dark:hover:bg-gray-700 dark:focus:ring-gray-500"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteChannelModal;

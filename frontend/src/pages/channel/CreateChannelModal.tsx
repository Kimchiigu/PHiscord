import React, { useState } from 'react';
import { db } from '../FirebaseConfig';
import { addDoc, collection } from 'firebase/firestore';
import { useAuth } from '../provider/AuthProvider';

interface CreateChannelModalProps {
  show: boolean;
  onClose: () => void;
  serverID: string;
  onChannelCreated: () => void;
}

const CreateChannelModal: React.FC<CreateChannelModalProps> = ({ show, onClose, serverID, onChannelCreated }) => {
  const { currentUser } = useAuth();
  const [channelType, setChannelType] = useState<'text' | 'voice'>('text');
  const [channelName, setChannelName] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isNsfw, setIsNsfw] = useState(false);
  const [creating, setCreating] = useState(false);

  const handleCreateChannel = async () => {
    if (!channelName) return;
    setCreating(true);
    const channelsCollection = collection(db, 'Servers', serverID, 'Channels');
    await addDoc(channelsCollection, { name: channelName, type: channelType, isPrivate, nsfw: isNsfw });
    onChannelCreated();
    setCreating(false);
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
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Create Channel</h3>
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
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Channel Type</label>
                <div className="mt-2">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      className="form-radio"
                      name="channelType"
                      value="text"
                      checked={channelType === 'text'}
                      onChange={() => setChannelType('text')}
                    />
                    <span className="ml-2">Text</span>
                  </label>
                  <label className="inline-flex items-center ml-6">
                    <input
                      type="radio"
                      className="form-radio"
                      name="channelType"
                      value="voice"
                      checked={channelType === 'voice'}
                      onChange={() => setChannelType('voice')}
                    />
                    <span className="ml-2">Voice</span>
                  </label>
                </div>
              </div>
              <div className="mb-4">
                <label htmlFor="channelName" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Channel Name</label>
                <input
                  type="text"
                  id="channelName"
                  className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={isPrivate}
                    onChange={(e) => setIsPrivate(e.target.checked)}
                  />
                  <span className="ml-2">Private Channel</span>
                </label>
              </div>
              <div className="mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={isNsfw}
                    onChange={(e) => setIsNsfw(e.target.checked)}
                  />
                  <span className="ml-2">NSFW Channel</span>
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  className="text-white inline-flex justify-center bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  onClick={handleCreateChannel}
                  disabled={creating}
                >
                  {creating ? 'Creating...' : 'Create Channel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateChannelModal;

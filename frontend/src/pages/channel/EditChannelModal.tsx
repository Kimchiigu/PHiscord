import React, { useState, useEffect } from 'react';
import { db } from '../../FirebaseConfig';
import { updateDoc, doc, getDoc } from 'firebase/firestore';

interface EditChannelModalProps {
  show: boolean;
  serverID: string;
  channelID: string;
  onClose: () => void;
  onChannelUpdated: () => void;
}

const EditChannelModal: React.FC<EditChannelModalProps> = ({ show, serverID, channelID, onClose, onChannelUpdated }) => {
  const [channelName, setChannelName] = useState('');
  const [isNsfw, setIsNsfw] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchChannelDetails = async () => {
      const channelDoc = await getDoc(doc(db, 'Servers', serverID, 'Channels', channelID));
      if (channelDoc.exists()) {
        const channelData = channelDoc.data();
        setChannelName(channelData.name);
        setIsNsfw(channelData.nsfw);
      }
    };

    if (serverID && channelID) {
      fetchChannelDetails();
    }
  }, [serverID, channelID]);

  const handleUpdateChannel = async () => {
    if (!channelName) return;
    setLoading(true);
    const channelDoc = doc(db, 'Servers', serverID, 'Channels', channelID);
    await updateDoc(channelDoc, { name: channelName, nsfw: isNsfw });
    onChannelUpdated();
    setLoading(false);
    onClose();
  };

  if (!show) return null;

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-[--overlay-color] opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div className="relative inline-block align-bottom bg-[--primary-bg-color] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full dark:bg-[--secondary-text-color]">
          <div className="relative bg-[--primary-bg-color] rounded-lg shadow dark:bg-[--secondary-text-color]">
            <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600">
              <h3 className="text-2xl font-bold text-[--primary-text-color]">Edit Channel</h3>
              <button
                type="button"
                className="text-gray-400 bg-transparent hover:bg-[--danger-button] hover:text-[--primary-text-color] rounded-lg text-sm h-8 w-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-[--primary-bg-color]"
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
                <label htmlFor="channelName" className="block text-sm font-medium text-[--secondary-text-color] dark:text-gray-300">Channel Name</label>
                <input
                  type="text"
                  id="channelName"
                  className="mt-1 block w-full border border-[--primary-bg-color] bg-[--secondary-bg-color] text-[--primary-text-color] rounded-md shadow-sm p-2"
                  value={channelName}
                  onChange={(e) => setChannelName(e.target.value)}
                />
              </div>
              <div className="mb-4">
                <label className="inline-flex items-center">
                  <input
                    type="checkbox"
                    className="form-checkbox"
                    checked={isNsfw}
                    onChange={(e) => setIsNsfw(e.target.checked)}
                  />
                  <span className="ml-2 text-[--primary-text-color]">NSFW Channel</span>
                </label>
              </div>
              <div className="flex justify-end">
                <button
                  className="text-[--primary-text-color] inline-flex justify-center bg-[--primary-button-color] hover:bg-[--primary-button-hover] focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  onClick={handleUpdateChannel}
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Channel'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EditChannelModal;

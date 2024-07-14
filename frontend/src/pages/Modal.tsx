import React, { useState } from 'react';
import { useAuth } from './provider/AuthProvider';
import { db, storage } from './FirebaseConfig';
import { addDoc, collection, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { v4 as uuidv4 } from 'uuid';

interface ModalProps {
  show: boolean;
  onClose: () => void;
  onServerCreated: () => void;
}

const Modal: React.FC<ModalProps> = ({ show, onClose, onServerCreated }) => {
  const { currentUser } = useAuth();
  const [selectedOption, setSelectedOption] = useState<'create' | 'join' | null>(null);
  const [step, setStep] = useState<'choose' | 'form'>('choose');
  const [serverName, setServerName] = useState('');
  const [serverImage, setServerImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [inviteLink, setInviteLink] = useState('');

  if (!show) return null;

  const handleOptionChange = (option: 'create' | 'join') => {
    setSelectedOption(option);
  };

  const handleNextStep = () => {
    if (selectedOption) {
      setStep('form');
    }
  };

  const handleClose = () => {
    setSelectedOption(null);
    setStep('choose');
    onClose();
  };

  const handleCreateServer = async () => {
    if (currentUser && serverName) {
      setUploading(true);
      let serverIconUrl = 'https://cdn.discordapp.com/embed/avatars/0.png'; // Default placeholder image URL

      if (serverImage) {
        const storageRef = ref(storage, `serverIcons/${currentUser.uid}/${serverImage.name}`);
        await uploadBytes(storageRef, serverImage);
        serverIconUrl = await getDownloadURL(storageRef);
      }

      try {
        const serversCollection = collection(db, 'Servers');
        const serverDoc = await addDoc(serversCollection, {
          serverName,
          ownerId: currentUser.uid,
          serverIconUrl,
          inviteLink: uuidv4()
        });

        // Add the owner to the server members
        const serverId = serverDoc.id;
        const serverMembersCollection = collection(db, `Servers/${serverId}/Members`);
        await addDoc(serverMembersCollection, {
          userId: currentUser.uid,
          role: 'owner'
        });

        onServerCreated(); // Trigger the callback to refresh the server list
        handleClose();
      } catch (error) {
        console.error("Error creating server: ", error);
      } finally {
        setUploading(false);
      }
    }
  };

  const handleJoinServer = async () => {
    if (currentUser && inviteLink) {
      try {
        // Find the server with the given invite link
        const serversCollection = collection(db, 'Servers');
        const serverSnapshot = await getDocs(serversCollection);
        let serverId = '';
        serverSnapshot.forEach(doc => {
          const serverData = doc.data();
          if (serverData.inviteLink === inviteLink) {
            serverId = doc.id;
          }
        });

        if (serverId) {
          // Add the current user to the server members
          const serverMembersCollection = collection(db, `Servers/${serverId}/Members`);
          await addDoc(serverMembersCollection, {
            userId: currentUser.uid,
            role: 'member'
          });

          onServerCreated(); // Trigger the callback to refresh the server list
          handleClose();
        } else {
          alert("Invalid invite link");
        }
      } catch (error) {
        console.error("Error joining server: ", error);
      }
    }
  };

  const renderForm = () => {
    return (
      <>
        {selectedOption === 'create' && (
          <div className="p-4 md:p-5 bg-[--primary-bg-color]">
            <h3 className="text-2xl font-bold text-[--primary-text-color]  mb-4">Create Your Own Server</h3>
            <div className="mb-4">
              <label htmlFor="serverName" className="block text-sm font-medium text-[--secondary-text-color] dark:text-gray-300">Server Name</label>
              <input
                type="text"
                id="serverName"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={serverName}
                onChange={(e) => setServerName(e.target.value)}
              />
            </div>
            <div className="mb-4">
              <label htmlFor="serverImage" className="block text-sm font-medium text-[--secondary-text-color] dark:text-gray-300">Server Image</label>
              <input
                type="file"
                id="serverImage"
                className="mt-1 block w-full text-sm text-[--primary-text-color] bg-gray-50 rounded-lg border border-gray-300 cursor-pointer dark:text-gray-400 dark:bg-gray-700 dark:border-gray-600"
                onChange={(e) => setServerImage(e.target.files?.[0] || null)}
              />
            </div>
            <button
              className="text-white inline-flex w-full justify-center bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              onClick={handleCreateServer}
              disabled={uploading}
            >
              {uploading ? 'Creating...' : 'Create Server'}
            </button>
          </div>
        )}
        {selectedOption === 'join' && (
          <div className="p-4 md:p-5">
            <h3 className="text-2xl font-bold text-[--primary-text-color] dark:text-white mb-4">Join a Server</h3>
            <div className="mb-4">
              <label htmlFor="inviteLink" className="block text-sm font-medium text-[--secondary-text-color] dark:text-gray-300">Invite Link</label>
              <input
                type="text"
                id="inviteLink"
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
                value={inviteLink}
                onChange={(e) => setInviteLink(e.target.value)}
              />
            </div>
            <button
              className="text-white inline-flex w-full justify-center bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
              onClick={handleJoinServer}
            >
              Join Server
            </button>
          </div>
        )}
      </>
    );
  };

  const renderChooseStep = () => (
    <div className="p-4 md:p-5">
      <p className="text-gray-500 dark:text-gray-400 mb-4 text-center">Your server is where you and your friends hang out. Make yours and start talking</p>
      <ul className="space-y-4 mb-4">
        <li>
          <input type="radio" id="create-server" name="server-option" value="create" className="hidden peer" required onChange={() => handleOptionChange('create')} />
          <label
            htmlFor="create-server"
            className="inline-flex items-center justify-between w-full p-5 text-[--primary-text-color] bg-white border border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-500 dark:peer-checked:text-blue-500 peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-[--primary-text-color] hover:bg-gray-100 dark:text-white dark:bg-gray-600 dark:hover:bg-gray-500"
          >
            <div className="block">
              <div className="w-full text-lg font-semibold">Create my Own Server</div>
              <div className="w-full text-gray-500 dark:text-gray-400">Create, Design, and Own it!</div>
            </div>
            <svg
              className="w-4 h-4 ms-3 rtl:rotate-180 text-gray-500 dark:text-gray-400"
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 14 10"
            >
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
            </svg>
          </label>
        </li>
        <li>
          <input type="radio" id="join-server" name="server-option" value="join" className="hidden peer" onChange={() => handleOptionChange('join')} />
          <label
            htmlFor="join-server"
            className="inline-flex items-center justify-between w-full p-5 text-[--primary-text-color] bg-white border border-gray-200 rounded-lg cursor-pointer dark:hover:text-gray-300 dark:border-gray-500  peer-checked:border-blue-600 peer-checked:text-blue-600 hover:text-[--primary-text-color] hover:bg-gray-100 "
          >
            <div className="block">
              <div className="w-full text-lg font-semibold">Join a Server</div>
              <div className="w-full text-gray-500 ">Get invited to a server!</div>
            </div>
            <svg
              className="w-4 h-4 ms-3 rtl:rotate-180 text-gray-500 "
              aria-hidden="true"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 14 10"
            >
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9"/>
            </svg>
          </label>
        </li>
      </ul>
      <button
        className="text-white inline-flex w-full justify-center bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm px-5 py-2.5 text-center "
        onClick={handleNextStep}
      >
        Next step
      </button>
    </div>
  );

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen px-4 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity">
          <div className="absolute inset-0 bg-gray-900 opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
        <div className="relative inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full ">
          <div className="relative p-4 w-full max-h-full">
            <div className="relative bg-white rounded-lg shadow ">
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t ">
                <h3 className="text-4xl font-bold text-[--primary-text-color] ">Create a Server</h3>
                <button
                  type="button"
                  className="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-[--primary-text-color] rounded-lg text-sm h-8 w-8 ms-auto inline-flex justify-center items-center "
                  onClick={handleClose}
                >
                  <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"/>
                  </svg>
                  <span className="sr-only">Close modal</span>
                </button>
              </div>
              {step === 'choose' ? renderChooseStep() : renderForm()}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;

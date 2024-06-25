import React, { useState } from 'react';
import { useAuth } from '../provider/AuthProvider';
import { db } from '../firebaseConfig';
import { doc, updateDoc } from 'firebase/firestore';
import Modal from './Modal';

const UserProfile = () => {
  const { currentUser, refreshCurrentUser } = useAuth();
  const [emailRevealed, setEmailRevealed] = useState(false);

  const [showDisplayNameModal, setShowDisplayNameModal] = useState(false);
  const [showUsernameModal, setShowUsernameModal] = useState(false);
  const [showPhoneNumberModal, setShowPhoneNumberModal] = useState(false);
  const [showProfilePictureModal, setShowProfilePictureModal] = useState(false);

  const [newDisplayName, setNewDisplayName] = useState(currentUser?.displayName || '');
  const [newUsername, setNewUsername] = useState(currentUser?.username || '');
  const [newPhoneNumber, setNewPhoneNumber] = useState('');
  const [newProfilePicture, setNewProfilePicture] = useState('');

  const toggleEmailVisibility = () => {
    setEmailRevealed(!emailRevealed);
  };

  const getCensoredEmail = (email: string) => {
    const [localPart, domain] = email.split('@');
    const censoredLocalPart = localPart.length > 2 
      ? localPart[0] + '*'.repeat(localPart.length - 2) + localPart.slice(-1) 
      : '*'.repeat(localPart.length);
    return `${censoredLocalPart}@${domain}`;
  };

  const handleUpdateProfile = async (field: string, value: string) => {
    if (currentUser) {
      const userDoc = doc(db, 'Users', currentUser.uid);
      await updateDoc(userDoc, { [field]: value });
      refreshCurrentUser();
    }
  };

  return (
    <div className="bg-[var(--bg-color)] min-h-screen flex items-center justify-center w-full text-[var(--text-color)]">
      <div className="bg-[var(--bg-color-second)] w-full max-w-4xl p-6 rounded-lg shadow-lg">
        <h2 className="text-xl font-semibold mb-4 text-left">My Account</h2>
        <div className="bg-indigo-500 p-4 rounded-t-lg flex items-center justify-between">
          <div className="flex items-center">
            <img
              src={currentUser?.profilePicture || "https://cdn.discordapp.com/embed/avatars/0.png"}
              alt="User Avatar"
              className="w-16 h-16 rounded-full border-4 border-black"
            />
            <div className="ml-4">
              <p className="text-lg font-bold text-white text-left">{currentUser?.username}</p>
              <div className="flex items-center mt-1">
                <div className="bg-gray-700 px-2 py-1 rounded-full text-sm font-medium flex items-center">
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11H9v4h2V7zm0 6H9v2h2v-2z" />
                  </svg>
                  <span className="ml-2 mr-2 text-white">Online</span>
                </div>
              </div>
            </div>
          </div>
          <button
            className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-gray-300"
            onClick={() => setShowProfilePictureModal(true)}
          >
            Edit Profile Picture
          </button>
        </div>
        <div className="bg-[var(--card-bg-color)] p-6 rounded-b-lg">
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-400 text-left">DISPLAY NAME</h3>
            <div className="flex justify-between items-center mt-1">
              <p>{currentUser?.displayName}</p>
              <button
                className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-gray-300"
                onClick={() => setShowDisplayNameModal(true)}
              >
                Edit
              </button>
            </div>
          </div>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-400 text-left">USERNAME</h3>
            <div className="flex justify-between items-center mt-1">
              <p>{currentUser?.username}</p>
              <button
                className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-gray-300"
                onClick={() => setShowUsernameModal(true)}
              >
                Edit
              </button>
            </div>
          </div>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-400 text-left">EMAIL</h3>
            <div className="flex justify-between items-center mt-1">
              <p>
                {emailRevealed ? currentUser?.email : getCensoredEmail(currentUser?.email || '')}{' '}
                <span
                  className="text-blue-500 cursor-pointer"
                  onClick={toggleEmailVisibility}
                >
                  {emailRevealed ? 'Hide' : 'Reveal'}
                </span>
              </p>
              <button className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-gray-300">Edit</button>
            </div>
          </div>
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-400 text-left">PHONE NUMBER</h3>
            <div className="flex justify-between items-center mt-1">
              <p>{currentUser?.phoneNumber || "You haven't added a phone number yet."}</p>
              <button
                className="bg-gray-700 hover:bg-gray-600 px-3 py-1 rounded text-gray-300"
                onClick={() => setShowPhoneNumberModal(true)}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal show={showDisplayNameModal} onClose={() => setShowDisplayNameModal(false)}>
        <h3 className="text-lg font-semibold mb-4">Edit Display Name</h3>
        <input
          type="text"
          value={newDisplayName}
          onChange={(e) => setNewDisplayName(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded"
        />
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            handleUpdateProfile('displayName', newDisplayName);
            setShowDisplayNameModal(false);
          }}
        >
          Save
        </button>
      </Modal>

      <Modal show={showUsernameModal} onClose={() => setShowUsernameModal(false)}>
        <h3 className="text-lg font-semibold mb-4">Edit Username</h3>
        <input
          type="text"
          value={newUsername}
          onChange={(e) => setNewUsername(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded"
        />
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            handleUpdateProfile('username', newUsername);
            setShowUsernameModal(false);
          }}
        >
          Save
        </button>
      </Modal>

      <Modal show={showPhoneNumberModal} onClose={() => setShowPhoneNumberModal(false)}>
        <h3 className="text-lg font-semibold mb-4">Add Phone Number</h3>
        <input
          type="text"
          value={newPhoneNumber}
          onChange={(e) => setNewPhoneNumber(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded"
        />
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            handleUpdateProfile('phoneNumber', newPhoneNumber);
            setShowPhoneNumberModal(false);
          }}
        >
          Save
        </button>
      </Modal>

      <Modal show={showProfilePictureModal} onClose={() => setShowProfilePictureModal(false)}>
        <h3 className="text-lg font-semibold mb-4">Edit Profile Picture</h3>
        <input
          type="text"
          value={newProfilePicture}
          onChange={(e) => setNewProfilePicture(e.target.value)}
          className="w-full p-2 mb-4 border border-gray-300 rounded"
          placeholder="Enter image URL"
        />
        <button
          className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
          onClick={() => {
            handleUpdateProfile('profilePicture', newProfilePicture);
            setShowProfilePictureModal(false);
          }}
        >
          Save
        </button>
      </Modal>
    </div>
  );
};

export default UserProfile;

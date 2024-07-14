import { useNavigate } from 'react-router-dom';
import { useAuth } from './provider/AuthProvider';
import { useState, useEffect } from 'react';
import { doc, updateDoc, onSnapshot } from 'firebase/firestore';
import { db } from './FirebaseConfig';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faMicrophone, faMicrophoneSlash, faVolumeUp, faVolumeMute, faCog } from '@fortawesome/free-solid-svg-icons';

function ProfileBar() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  useEffect(() => {
    if (currentUser) {
      const userDocRef = doc(db, 'Users', currentUser.uid);
      const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
          const userData = docSnapshot.data();
          setIsMuted(userData.isMuted || false);
          setIsDeafened(userData.isDeafened || false);
        }
      });

      // Cleanup subscription on unmount
      return () => {
        unsubscribe();
      };
    }
  }, [currentUser]);

  const handleSettingsClick = () => {
    navigate('/settings/general');
  };

  const toggleMute = async () => {
    if (currentUser) {
      const newIsMuted = !isMuted;
      setIsMuted(newIsMuted);
      await updateDoc(doc(db, 'Users', currentUser.uid), {
        isMuted: newIsMuted,
      });
    }
  };

  const toggleDeafen = async () => {
    if (currentUser) {
      const newIsDeafened = !isDeafened;
      setIsDeafened(newIsDeafened);
      await updateDoc(doc(db, 'Users', currentUser.uid), {
        isDeafened: newIsDeafened,
      });
    }
  };

  return (
    <div className="absolute bottom-0 left-0 w-full flex items-center justify-between p-4 bg-[--primary-bg-color] text-gray-100">
      <div className="flex items-center">
        <img src={currentUser?.profilePicture || "https://cdn.discordapp.com/embed/avatars/0.png"} alt="User Avatar" className="w-10 h-10 rounded-full" />
        <div className="ml-3">
          <p className="text-sm font-semibold text-left text-[--primary-text-color]">{currentUser?.displayName}</p>
          <p className="text-xs text-[--secondary-text-color] text-left">{currentUser?.customStatus || (currentUser?.isOnline ? 'Online' : 'Offline')}</p>
        </div>
      </div>
      <div className="flex items-center space-x-2">
        <button className="p-1 hover:bg-gray-700 rounded-lg" onClick={toggleMute}>
          <FontAwesomeIcon icon={isMuted ? faMicrophoneSlash : faMicrophone} className={`w-5 h-5 ${isMuted ? 'text-red-500' : 'text-gray-100'}`} />
        </button>
        <button className="p-1 hover:bg-gray-700 rounded-lg" onClick={toggleDeafen}>
          <FontAwesomeIcon icon={isDeafened ? faVolumeMute : faVolumeUp} className={`w-5 h-5 ${isDeafened ? 'text-red-500' : 'text-gray-100'}`} />
        </button>
        <button className="p-1 hover:bg-gray-700 rounded-lg" onClick={handleSettingsClick}>
          <FontAwesomeIcon icon={faCog} className="w-5 h-5 text-gray-100" />
        </button>
      </div>
    </div>
  );
}

export default ProfileBar;

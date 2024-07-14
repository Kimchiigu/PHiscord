import React, { useState, useEffect } from 'react';
import { useAuth } from '../provider/AuthProvider';
import { db } from '../FirebaseConfig';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const PrivacySettings = () => {
  const { currentUser } = useAuth();
  const [privacySettings, setPrivacySettings] = useState({
    guestMessages: 'allow',
    voiceCall: 'allow',
    videoCall: 'allow'
  });

  useEffect(() => {
    if (currentUser) {
      const fetchPrivacySettings = async () => {
        const settingsDoc = await getDoc(doc(db, 'Users', currentUser.uid, 'Settings', 'Privacy'));
        if (settingsDoc.exists()) {
          setPrivacySettings(settingsDoc.data() as any);
        }
      };
      fetchPrivacySettings();
    }
  }, [currentUser]);

  const handleChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = event.target;
    const newSettings = { ...privacySettings, [name]: value };
    setPrivacySettings(newSettings);

    if (currentUser) {
      await setDoc(doc(db, 'Users', currentUser.uid, 'Settings', 'Privacy'), newSettings);
    }
  };

  return (
    <div className="bg-[--bg-color] p-8 rounded-lg shadow-md w-full">
      <h1 className="text-2xl text-[--primary-text-color] font-semibold mb-6">Privacy Settings</h1>
      <div className="mb-4 text-left">
        <label className="block text-[--primary-text-color] mb-2">Messages from guests</label>
        <select
          name="guestMessages"
          value={privacySettings.guestMessages}
          onChange={handleChange}
          className="block w-full mt-1 p-2 text-[--primary-text-color] bg-[--secondary-bg-color] border border-gray-300 dark:border-gray-600 rounded-md"
        >
          <option value="allow">Allow</option>
          <option value="hide">Hide</option>
          <option value="block">Block</option>
        </select>
      </div>
      <div className="mb-4 text-left">
        <label className="block text-[--primary-text-color] mb-2">Voice call</label>
        <select
          name="voiceCall"
          value={privacySettings.voiceCall}
          onChange={handleChange}
          className="block w-full mt-1 p-2 text-[--primary-text-color] bg-[--secondary-bg-color] border border-gray-300 dark:border-gray-600 rounded-md"
        >
          <option value="allow">Allow</option>
          <option value="block">Block</option>
        </select>
      </div>
      <div className="mb-4 text-left">
        <label className="block text-[--primary-text-color] mb-2">Video call</label>
        <select
          name="videoCall"
          value={privacySettings.videoCall}
          onChange={handleChange}
          className="block w-full mt-1 p-2 bg-[--secondary-bg-color] text-[--primary-text-color] border border-gray-300 dark:border-gray-600 rounded-md"
        >
          <option value="allow">Allow</option>
          <option value="block">Block</option>
        </select>
      </div>
    </div>
  );
};

export default PrivacySettings;

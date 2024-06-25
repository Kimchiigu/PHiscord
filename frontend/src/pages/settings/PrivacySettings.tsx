import React from 'react';
import { useAuth } from '../provider/AuthProvider';

const PrivacySettings = () => {
  const { currentUser } = useAuth();

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full">
      <h1>ini privacy</h1>
    </div>
  );
};

export default PrivacySettings;

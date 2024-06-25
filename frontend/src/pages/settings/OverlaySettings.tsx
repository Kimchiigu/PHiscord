import React from 'react';
import { useAuth } from '../provider/AuthProvider';

const OverlaySettings = () => {
  const { currentUser } = useAuth();

  return (
    <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md w-full">
      <h1>ini overlay</h1>
    </div>
  );
};

export default OverlaySettings;

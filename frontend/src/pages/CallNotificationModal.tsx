import React from 'react';

interface CallNotificationModalProps {
  callerName: string;
  onAccept: () => void;
  onDecline: () => void;
}

const CallNotificationModal: React.FC<CallNotificationModalProps> = ({ callerName, onAccept, onDecline }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
      <div className="bg-gray-800 p-4 rounded-lg text-center">
        <p className="text-white text-lg mb-4">{callerName} is calling you. Do you want to accept?</p>
        <div className="flex justify-around">
          <button className="bg-green-500 text-white px-4 py-2 rounded-lg" onClick={onAccept}>Accept</button>
          <button className="bg-red-500 text-white px-4 py-2 rounded-lg" onClick={onDecline}>Decline</button>
        </div>
      </div>
    </div>
  );
};

export default CallNotificationModal;

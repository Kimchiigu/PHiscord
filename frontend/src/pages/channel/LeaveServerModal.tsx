import React from 'react';

interface LeaveServerModalProps {
  show: boolean;
  serverName: string;
  onClose: () => void;
  onLeave: () => void;
}

const LeaveServerModal: React.FC<LeaveServerModalProps> = ({ show, serverName, onClose, onLeave }) => {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed z-10 inset-0 overflow-y-auto">
      <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        <div className="fixed inset-0 transition-opacity" aria-hidden="true">
          <div className="absolute inset-0 bg-[--overlay-color] opacity-75"></div>
        </div>
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>
        <div className="inline-block align-bottom bg-[--primary-bg-color] rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <div className="bg-[--primary-bg-color] px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
            <div className="sm:flex sm:items-start">
              <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9l-5 5-5-5" />
                </svg>
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                <h3 className="text-lg leading-6 font-medium text-[--primary-text-color]" id="modal-title">
                  Leave '{serverName}'
                </h3>
                <div className="mt-2">
                  <p className="text-sm text-[--secondary-text-color]">
                    Are you sure you want to leave {serverName}? You will not be able to access this server anymore.
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="bg-[--primary-bg-color] px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
            <button type="button" className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm" onClick={onLeave}>
              Leave Server
            </button>
            <button type="button" className="mt-3 w-full inline-flex justify-center rounded-md shadow-sm px-4 py-2 bg-[--primary-button-color] text-base font-medium text-[--primary-text-color] hover:bg-[--primary-button-hover] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:w-auto sm:text-sm" onClick={onClose}>
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LeaveServerModal;

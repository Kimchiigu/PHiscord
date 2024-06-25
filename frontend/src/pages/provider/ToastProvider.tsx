import React, { createContext, useContext, ReactNode } from 'react';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const ToastContext = createContext<{ showToast: (message: string, type: 'success' | 'error') => void }>({
  showToast: () => {},
});

export const useToast = () => useContext(ToastContext);

const ToastProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const showToast = (message: string, type: 'success' | 'error') => {
    if (type === 'success') {
      toast.success(message);
    } else {
      toast.error(message);
    }
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
};

export default ToastProvider;

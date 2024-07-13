import React from 'react';
import { useTheme } from '../provider/ThemeProvider';
import { db } from '../FirebaseConfig';
import { getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const AppearanceSettings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { currentUser } = getAuth();

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    if (currentUser) {
      try {
        await setDoc(doc(db, 'Users', currentUser.uid, 'Settings', 'Appearance'), {
          theme: newTheme
        });
        console.log('Theme updated successfully');
      } catch (error) {
        console.error('Error updating theme: ', error);
      }
    }
  };

  return (
    <div className="w-full p-4 bg-[var(--bg-color)] text-[var(--text-color)] min-h-screen flex items-center justify-center">
      <div className="bg-[var(--bg-color)] w-full max-w-4xl p-6 rounded-lg shadow-lg text-[var(--text-color)]">
        <h2 className="text-xl text-left font-semibold mb-4">Appearance Settings</h2>
        <div className="mb-6">
          <h3 className="text-lg text-left font-medium mb-2">Theme</h3>
          <div className="flex items-center space-x-4">
            <button
              className={`w-10 h-10 rounded-full ${theme === 'light' ? 'ring-4 ring-blue-500' : ''}`}
              style={{ backgroundColor: '#ffffff' }}
              onClick={() => handleThemeChange('light')}
            ></button>
            <button
              className={`w-10 h-10 rounded-full ${theme === 'dark' ? 'ring-4 ring-blue-500' : ''}`}
              style={{ backgroundColor: '#1a202c' }}
              onClick={() => handleThemeChange('dark')}
            ></button>
            <button
              className={`w-10 h-10 rounded-full ${theme === 'purple' ? 'ring-4 ring-blue-500' : ''}`}
              style={{ backgroundColor: '#370058' }}
              onClick={() => handleThemeChange('purple')}
            ></button>
            <button
              className={`w-10 h-10 rounded-full ${theme === 'cyan' ? 'ring-4 ring-blue-500' : ''}`}
              style={{ backgroundColor: '#92f8ff' }}
              onClick={() => handleThemeChange('cyan')}
            ></button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;

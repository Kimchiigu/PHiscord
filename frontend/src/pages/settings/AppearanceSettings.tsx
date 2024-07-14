import React, { useState } from 'react';
import { useTheme } from '../provider/ThemeProvider';
import { db } from '../FirebaseConfig';
import { getAuth } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';

const AppearanceSettings: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const { currentUser } = getAuth();
  const [fontSize, setFontSize] = useState('medium');

  const handleThemeChange = async (newTheme: string) => {
    setTheme(newTheme);
    if (currentUser) {
      try {
        await setDoc(doc(db, 'Users', currentUser.uid, 'Settings', 'Appearance'), {
          theme: newTheme,
          fontSize: fontSize // Ensure fontSize is also saved
        }, { merge: true });
        console.log('Theme updated successfully');
      } catch (error) {
        console.error('Error updating theme: ', error);
      }
    }
  };

  const handleFontSizeChange = async (event: React.ChangeEvent<HTMLSelectElement>) => {
    const newFontSize = event.target.value;
    setFontSize(newFontSize);
    if (currentUser) {
      try {
        await setDoc(doc(db, 'Users', currentUser.uid, 'Settings', 'Appearance'), {
          theme: theme, // Ensure theme is also saved
          fontSize: newFontSize
        }, { merge: true });
        console.log('Font size updated successfully');
      } catch (error) {
        console.error('Error updating font size: ', error);
      }
    }
  };

  return (
    <div className="w-full p-4 bg-[var(--bg-color)] text-[var(--text-color)] min-h-screen flex items-center justify-center">
      <div className="bg-[var(--primary-bg-color)] w-full max-w-4xl p-6 rounded-lg shadow-lg text-[var(--text-color)]">
        <h2 className="text-xl text-[--primary-text-color] text-left font-semibold mb-4">Appearance Settings</h2>
        <div className="mb-6">
          {/* Color Theme */}
          <h3 className="text-lg text-left font-medium mb-2 text-[--primary-text-color]">Theme</h3>
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
              className={`w-10 h-10 rounded-full ${theme === 'orange' ? 'ring-4 ring-blue-500' : ''}`}
              style={{ backgroundColor: '#ff6f00' }}
              onClick={() => handleThemeChange('orange')}
            ></button>
            <button
              className={`w-10 h-10 rounded-full ${theme === 'red' ? 'ring-4 ring-blue-500' : ''}`}
              style={{ backgroundColor: '#d32f2f' }}
              onClick={() => handleThemeChange('red')}
            ></button>
            <button
              className={`w-10 h-10 rounded-full ${theme === 'pink' ? 'ring-4 ring-blue-500' : ''}`}
              style={{ backgroundColor: '#d81b60' }}
              onClick={() => handleThemeChange('pink')}
            ></button>
            <button
              className={`w-10 h-10 rounded-full ${theme === 'green' ? 'ring-4 ring-blue-500' : ''}`}
              style={{ backgroundColor: '#2e7d32' }}
              onClick={() => handleThemeChange('green')}
            ></button>
            <button
              className={`w-10 h-10 rounded-full ${theme === 'blue' ? 'ring-4 ring-blue-500' : ''}`}
              style={{ backgroundColor: '#1976d2' }}
              onClick={() => handleThemeChange('blue')}
            ></button>
            <button
              className={`w-10 h-10 rounded-full ${theme === 'brown' ? 'ring-4 ring-blue-500' : ''}`}
              style={{ backgroundColor: '#6d4c41' }}
              onClick={() => handleThemeChange('brown')}
            ></button>
            <button
              className={`w-10 h-10 rounded-full ${theme === 'yellow' ? 'ring-4 ring-blue-500' : ''}`}
              style={{ backgroundColor: '#fbc02d' }}
              onClick={() => handleThemeChange('yellow')}
            ></button>
          </div>
          {/* Font Size */}
          <h3 className="text-lg text-left font-medium mt-6 mb-2 text-[--primary-text-color]">Font Size</h3>
          <select
            value={fontSize}
            onChange={handleFontSizeChange}
            className="p-2 rounded border w-full bg-[var(--secondary-bg-color)] text-[var(--primary-text-color)]"
          >
            <option value="small">Small</option>
            <option value="medium">Medium</option>
            <option value="large">Large</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default AppearanceSettings;

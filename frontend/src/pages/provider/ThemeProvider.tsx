import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { db } from '../../FirebaseConfig';
import { useAuth } from './AuthProvider';
import { doc, onSnapshot } from 'firebase/firestore';

interface ThemeContextType {
  theme: string;
  setTheme: (newTheme: string) => void;
  fontSize: string;
  setFontSize: (newFontSize: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [theme, setThemeState] = useState<string>('light');
  const [fontSize, setFontSizeState] = useState<string>('medium');

  useEffect(() => {
    if (!currentUser) return;

    const themeDocRef = doc(db, 'Users', currentUser.uid, 'Settings', 'Appearance');

    const unsubscribe = onSnapshot(themeDocRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const data = docSnapshot.data();
        if (data) {
          if (data.theme) {
            setThemeState(data.theme);
          }
          if (data.fontSize) {
            setFontSizeState(data.fontSize);
          }
        }
      }
    });

    return () => unsubscribe();
  }, [currentUser]);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.style.fontSize = fontSize;
  }, [fontSize]);

  const setTheme = (newTheme: string) => {
    setThemeState(newTheme);
  };

  const setFontSize = (newFontSize: string) => {
    setFontSizeState(newFontSize);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, fontSize, setFontSize }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

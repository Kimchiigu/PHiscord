import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { auth } from '../firebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';

interface User {
  uid: string;
  username: string;
  displayName: string | null;
  email: string | null;
  discriminator: string | null;
  profilePicture: string | null;
  phoneNumber: string | null;
}

interface AuthContextType {
  currentUser: User | null;
  refreshCurrentUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const fetchUserData = async (uid: string) => {
    const userDoc = doc(db, 'Users', uid);
    const userSnap = await getDoc(userDoc);
    if (userSnap.exists()) {
      const userData = userSnap.data();
      setCurrentUser({
        uid,
        username: userData.username || 'Anonymous',
        displayName: userData.displayName || 'Anonymous',
        email: userData.email,
        discriminator: uid.slice(-4),
        profilePicture: userData.profilePicture || null,
        phoneNumber: userData.phoneNumber || null,
      });
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        fetchUserData(user.uid);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const refreshCurrentUser = () => {
    if (currentUser?.uid) {
      fetchUserData(currentUser.uid);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, refreshCurrentUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

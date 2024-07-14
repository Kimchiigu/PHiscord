import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { auth } from '../../FirebaseConfig';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../FirebaseConfig';

interface User {
  uid: string;
  username: string;
  displayName: string | null;
  email: string | null;
  discriminator: string | null;
  profilePicture: string | null;
  phoneNumber: string | null;
  isOnline: boolean;
  customStatus: string | null;
  dob: {date: number, month: number, year: number} | null;
}

interface AuthContextType {
  currentUser: User | null;
  refreshCurrentUser: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const fetchUserData = useCallback(async (uid: string) => {
    console.log(`Fetching user data for UID: ${uid}`);
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
        isOnline: userData.isOnline,
        customStatus: userData.customStatus || null,
        dob: userData.dob || null,
      });
    }
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        fetchUserData(user.uid);
      } else {
        setCurrentUser(null);
      }
    });

    return () => unsubscribe();
  }, [fetchUserData]);

  const refreshCurrentUser = useCallback(() => {
    if (currentUser?.uid) {
      fetchUserData(currentUser.uid);
    }
  }, [currentUser?.uid, fetchUserData]);

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

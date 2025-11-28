import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '../config/firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(null); // Firebase user object
  const [userData, setUserData] = useState(null);       // Firestore user data
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setLoading(true);
      setCurrentUser(user);
      setUserData(null);

      if (user) {
        try {
          const schools = ['Consolatrix College of Toledo City', 'Kaken College of Toledo City'];
          let userDocData = null;
          let userSchool = null;

          for (const school of schools) {
            const userRef = doc(db, 'schools', school, 'users', user.uid);
            const snap = await getDoc(userRef);
            if (snap.exists()) {
              userDocData = snap.data();
              userSchool = school;
              break;
            }
          }

          if (!userDocData) {
            await signOut(auth);
            setCurrentUser(null);
            setUserData(null);
          } else {
            const combinedData = {
              uid: user.uid,
              email: user.email,
              school: userSchool,
              ...userDocData,
            };
            setUserData(combinedData);
            localStorage.setItem('user', JSON.stringify(combinedData));
          }
        } catch (err) {
          console.error('Error fetching user data:', err);
        }
      } else {
        localStorage.removeItem('user');
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ currentUser, userData, setUserData, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
};

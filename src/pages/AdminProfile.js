import React, { useEffect, useState, useCallback } from 'react';
import { getAuth, onAuthStateChanged, updateProfile, updateEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import AdminNavbar from '../components/AdminNavbar';
import './Profile.css';

function AdminProfile() {
  const auth = getAuth();
  const [user, setUser] = useState(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Watch for auth state changes (fixes refresh issue)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, [auth]);

  const fetchAdminData = useCallback(async (firebaseUser) => {
    if (firebaseUser) {
      setLoading(true);
      const adminRef = doc(db, 'admins', firebaseUser.uid);
      const adminSnap = await getDoc(adminRef);
      const adminData = adminSnap.exists() ? adminSnap.data() : {};

      setFullName(
        adminData.fullName && adminData.fullName.trim() !== ''
          ? adminData.fullName
          : firebaseUser.displayName || ''
      );
      setEmail(
        adminData.email && adminData.email.trim() !== ''
          ? adminData.email
          : firebaseUser.email || ''
      );

      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (user) {
      fetchAdminData(user);
    }
  }, [user, fetchAdminData]);

  const handleUpdate = async () => {
    if (!user) {
      alert('Missing admin user!');
      return;
    }
    try {
      await updateProfile(user, { displayName: fullName });
      if (email !== user.email) {
        await updateEmail(user, email);
      }
      const adminRef = doc(db, 'admins', user.uid);
      await setDoc(adminRef, { fullName, email }, { merge: true });

      alert('Admin profile updated successfully!');
      fetchAdminData(user);
    } catch (error) {
      alert('Error updating admin profile: ' + error.message);
    }
  };

  return (
    <div className="profile-page-fb">
      <AdminNavbar />
      <div className="profile-main-fb" style={{ maxWidth: 450, margin: '40px auto' }}>
        <div className="profile-card-fb" style={{ position: 'relative' }}>
          <h1 style={{ marginBottom: 28, textAlign: 'center' }}>Admin Profile</h1>

          {loading ? (
            <p style={{ textAlign: 'center' }}>Loading...</p>
          ) : (
            <>
              <div className="profile-fields-fb">
                <div className="profile-field-fb">
                  <label>Full Name</label>
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    maxLength={50}
                    disabled={!isEditing}
                  />
                </div>
                <div className="profile-field-fb">
                  <label>Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={!isEditing}
                  />
                </div>
              </div>

              {!isEditing ? (
                <button
                  className="edit-btn-fb"
                  style={{ marginTop: 24, width: '100%' }}
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </button>
              ) : (
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <button
                    className="save-btn-fb"
                    style={{ flex: 1 }}
                    onClick={() => {
                      handleUpdate();
                      setIsEditing(false);
                    }}
                  >
                    Save Changes
                  </button>
                  <button
                    className="cancel-btn-fb"
                    style={{ flex: 1 }}
                    onClick={() => {
                      setIsEditing(false);
                      fetchAdminData(user);
                    }}
                  >
                    Cancel
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminProfile;

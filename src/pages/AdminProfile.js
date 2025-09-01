import React, { useEffect, useState, useCallback } from 'react';
import { getAuth, updateProfile, updateEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import AdminNavbar from '../components/AdminNavbar';
import './Profile.css';

function AdminProfile() {
  const auth = getAuth();
  const user = auth.currentUser;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);

  // Fetch admin data from Firestore (top-level "admins" collection)
  const fetchAdminData = useCallback(async () => {
    if (user) {
      setLoading(true);
      const adminRef = doc(db, 'admins', user.uid);
      const adminSnap = await getDoc(adminRef);
      const adminData = adminSnap.exists() ? adminSnap.data() : {};

      setFullName(
        adminData.fullName !== undefined && adminData.fullName !== ''
          ? adminData.fullName
          : user.displayName || ''
      );
      setEmail(
        adminData.email !== undefined && adminData.email !== ''
          ? adminData.email
          : user.email || ''
      );

      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchAdminData();
  }, [fetchAdminData]);

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
      // Save to Firestore (admins collection)
      const adminRef = doc(db, 'admins', user.uid);
      await setDoc(adminRef, { fullName, email }, { merge: true });

      alert('Admin profile updated successfully!');
      fetchAdminData();
    } catch (error) {
      alert('Error updating admin profile: ' + error.message);
    }
  };

  return (
    <div className="profile-page-fb">
      <AdminNavbar />
      <div className="profile-main-fb" style={{ maxWidth: 450, margin: '40px auto' }}>
        <div className="profile-card-fb" style={{ position: 'relative' }}>
          <h3 className="section-title-fb" style={{ marginBottom: 28 }}>Admin Profile</h3>
          
          <div className="profile-fields-fb">
            <div className="profile-field-fb">
              <label>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                disabled={!isEditing || loading}
              />
            </div>
            <div className="profile-field-fb">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={!isEditing || loading}
              />
            </div>
          </div>

          {/* Edit / Save / Cancel */}
          {!isEditing ? (
            <button
              className="edit-btn-fb"
              style={{ marginTop: 24, width: '100%' }}
              onClick={() => setIsEditing(true)}
              disabled={loading}
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
                disabled={loading}
              >
                Save Changes
              </button>
              <button
                className="cancel-btn-fb"
                style={{ flex: 1 }}
                onClick={() => {
                  setIsEditing(false);
                  fetchAdminData();
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AdminProfile;

import React, { useEffect, useState, useCallback } from 'react';
import { getAuth, updateProfile, updateEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import NavbarHome from '../components/NavbarHome';
import VerificationForm from '../components/VerificationForm';
import './Profile.css';

function Profile() {
  const auth = getAuth();
  const user = auth.currentUser;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [loadingSchool, setLoadingSchool] = useState(true);

  // 1. Read school from localStorage on mount
  useEffect(() => {
    const localUser = localStorage.getItem('user');
    if (localUser) {
      const userData = JSON.parse(localUser);
      if (userData.school) {
        setSchoolName(userData.school);
      }
    }
  }, []);

  // 2. Fetch user profile from the school's users subcollection
  const fetchUserData = useCallback(async () => {
    if (user && schoolName) {
      setLoadingSchool(true);
      const schoolUserRef = doc(db, 'schools', schoolName, 'users', user.uid);
      const schoolUserSnap = await getDoc(schoolUserRef);
      const schoolUserData = schoolUserSnap.exists() ? schoolUserSnap.data() : {};

      setFullName(
        schoolUserData.fullName !== undefined && schoolUserData.fullName !== ''
          ? schoolUserData.fullName
          : user.displayName || ''
      );
      setEmail(
        schoolUserData.email !== undefined && schoolUserData.email !== ''
          ? schoolUserData.email
          : user.email || ''
      );
      setVerificationStatus(schoolUserData.verificationStatus || '');
      setLoadingSchool(false);
    }
  }, [user, schoolName]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleUpdate = async () => {
    if (!user || !schoolName) {
      alert('Missing user or school name!');
      return;
    }
    try {
      await updateProfile(user, { displayName: fullName });
      if (email !== user.email) {
        await updateEmail(user, email);
      }
      // Update school subcollection
      const schoolUserRef = doc(db, 'schools', schoolName, 'users', user.uid);
      await setDoc(schoolUserRef, { fullName, email }, { merge: true });
      // Update top-level users collection (optional, keeps things in sync)
      const topUserRef = doc(db, 'users', user.uid);
      await setDoc(topUserRef, { fullName, email, school: schoolName }, { merge: true });

      alert('Profile updated successfully!');
      fetchUserData();
    } catch (error) {
      alert('Error updating profile: ' + error.message);
    }
  };

  return (
    <div className="profile-page-fb">
      <NavbarHome />
      <div className="profile-main-fb" style={{ maxWidth: 400, margin: '40px auto' }}>
        <div className="profile-card-fb" style={{ position: 'relative' }}>
          {/* Get Verified Button at top right */}
          {verificationStatus !== 'verified' && (
            <button
              className="verify-btn-fb"
              style={{
                position: 'absolute',
                top: 24,
                right: 24,
                padding: '8px 18px',
                fontSize: '0.98rem',
                fontWeight: 600,
                background: '#1877f2',
                color: '#fff',
                border: 'none',
                borderRadius: 6,
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(24,119,242,0.08)'
              }}
              onClick={() => setShowVerifyForm(true)}
              disabled={loadingSchool || !schoolName}
            >
              Get Verified
            </button>
          )}

          <h3 className="section-title-fb" style={{marginBottom: 28}}>Profile</h3>
          <div className="profile-fields-fb">
            <div className="profile-field-fb">
              <label>Full Name</label>
              <input
                type="text"
                value={fullName}
                onChange={e => setFullName(e.target.value)}
                disabled={!isEditing || verificationStatus === 'verified' || loadingSchool || !schoolName}
              />
            </div>
            <div className="profile-field-fb">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                disabled={!isEditing || verificationStatus === 'verified' || loadingSchool || !schoolName}
              />
            </div>
          </div>
          {/* Status Badge */}
          {verificationStatus === 'verified' ? (
            <div className="verified-badge-fb" style={{marginTop: 24, textAlign: 'center'}}>✅ Verified</div>
          ) : verificationStatus === 'pending' ? (
            <div className="pending-badge-fb" style={{marginTop: 24, textAlign: 'center'}}>⏳ Waiting for admin approval...</div>
          ) : null}
          {/* Save Button for unverified users */}
          {verificationStatus !== 'verified' && (
            <>
              {!isEditing && (
                <button
                  className="edit-btn-fb"
                  style={{marginTop: 24, width: '100%'}}
                  onClick={() => setIsEditing(true)}
                  disabled={loadingSchool || !schoolName}
                >
                  Edit Profile
                </button>
              )}
              {isEditing && (
                <div style={{display: 'flex', gap: 12, marginTop: 24}}>
                  <button
                    className="save-btn-fb"
                    style={{flex: 1}}
                    onClick={() => {
                      handleUpdate();
                      setIsEditing(false);
                    }}
                    disabled={loadingSchool || !schoolName}
                  >
                    Save Changes
                  </button>
                  <button
                    className="cancel-btn-fb"
                    style={{flex: 1}}
                    onClick={() => {
                      setIsEditing(false);
                      fetchUserData();
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

      {/* Verification Modal */}
      {showVerifyForm && (
        <div className="verify-modal-overlay">
          <div className="verify-modal-content">
            <button
              style={{
                position: 'absolute',
                top: 12,
                right: 12,
                background: 'none',
                border: 'none',
                fontSize: 22,
                color: '#888',
                cursor: 'pointer'
              }}
              onClick={() => setShowVerifyForm(false)}
              aria-label="Close"
            >
              &times;
            </button>
            <VerificationForm
            onSubmit={async (form) => {
              setIsVerifying(true);
              try {
                const { proofFile, ...restForm } = form; // Exclude proofFile
                await setDoc(
                  doc(db, 'schools', schoolName, 'users', user.uid),
                  {
                    verificationStatus: 'pending',
                    verificationRequest: restForm
                  },
                  { merge: true }
                );
                setVerificationStatus('pending');
                setShowVerifyForm(false);
                alert('Verification request sent! Please wait for admin approval.');
              } catch (err) {
                alert('Failed to send verification request: ' + err.message);
                console.error(err);
              }
              setIsVerifying(false);
            }}
              onCancel={() => setShowVerifyForm(false)}
              loading={isVerifying}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export default Profile;
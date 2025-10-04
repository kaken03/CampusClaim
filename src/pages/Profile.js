import React, { useEffect, useState } from 'react';
import { getAuth, onAuthStateChanged, updateProfile, updateEmail } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import NavbarHome from '../components/NavbarHome';
import VerificationForm from '../components/VerificationForm';
import './Profile.css';
import {FaCheckCircle} from 'react-icons/fa';

function Profile() {
  const auth = getAuth();
  const [user, setUser] = useState(null);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [verificationStatus, setVerificationStatus] = useState('');
  const [showVerifyForm, setShowVerifyForm] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [schoolName, setSchoolName] = useState('');
  const [loadingSchool, setLoadingSchool] = useState(true);
  const [actionMessage, setActionMessage] = useState('');

  // 1. Watch for auth state changes (fixes refresh issue)
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
    });
    return () => unsubscribe();
  }, [auth]);

  // 2. Read cached school/status from localStorage
  useEffect(() => {
    const localUser = localStorage.getItem('user');
    if (localUser) {
      const userData = JSON.parse(localUser);
      if (userData.school) setSchoolName(userData.school);
      if (userData.verificationStatus) setVerificationStatus(userData.verificationStatus);
    }
  }, []);

  // 3. Subscribe to Firestore user doc when user + schoolName available
  useEffect(() => {
    if (!user || !schoolName) return;

    setLoadingSchool(true);
    const schoolUserRef = doc(db, 'schools', schoolName, 'users', user.uid);

    const unsubscribe = onSnapshot(schoolUserRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setFullName(data.fullName || user.displayName || '');
        setEmail(data.email || user.email || '');
        setVerificationStatus(data.verificationStatus || '');

        // cache
        localStorage.setItem(
          'user',
          JSON.stringify({
            school: schoolName,
            verificationStatus: data.verificationStatus || '',
          })
        );
      } else {
        setFullName(user.displayName || '');
        setEmail(user.email || '');
      }
      setLoadingSchool(false);
    });

    return () => unsubscribe();
  }, [user, schoolName]);

  // Floating message auto-hide
  useEffect(() => {
    if (actionMessage) {
      const timer = setTimeout(() => setActionMessage(''), 2000);
      return () => clearTimeout(timer);
    }
  }, [actionMessage]);

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

      const schoolUserRef = doc(db, 'schools', schoolName, 'users', user.uid);
      await setDoc(schoolUserRef, { fullName, email }, { merge: true });

      const topUserRef = doc(db, 'users', user.uid);
      await setDoc(topUserRef, { fullName, email, school: schoolName }, { merge: true });

      setActionMessage('Profile updated successfully!');
    } catch (error) {
      setActionMessage('Error updating profile: ' + error.message);
    }
  };

  const isPending = verificationStatus === 'pending';
  const isVerified = verificationStatus === 'verified';

  return (
    <div>
      <NavbarHome />
      <div className="profile-main-fb">
        {actionMessage && (
          <div className="profile-action-message">{actionMessage}</div>
        )}
        {loadingSchool ? (
          <div className="skeleton-card">
            <div className="skeleton-title"></div>
            <div className="skeleton-field"></div>
            <div className="skeleton-field"></div>
            <div className="skeleton-btn"></div>
          </div>
        ) : (
          <div className="profile-card-fb">
            <div className="profile-fields-fb">
              <div className="profile-field-fb">
                <label>Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  maxLength={50}
                  disabled={!isEditing || isVerified || isPending || !schoolName}
                />
              </div>
              <div className="profile-field-fb">
                <label>Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={!isEditing || isVerified || isPending || !schoolName}
                />
              </div>
            </div>

            {isVerified ? (
              <div className="verified-badge-fb"> <FaCheckCircle /> Verified</div>
            ) : isPending ? (
              <div className="pending-badge-fb">⏳ Waiting for admin approval...</div>
            ) : (
              <button
                className="verify-btn-fb"
                onClick={() => setShowVerifyForm(true)}
                disabled={!schoolName}
                style={{ margin: '24px auto 0 auto', display: 'block', width: '80%' }}
              >
                Get Verified
              </button>
            )}

            {!isVerified && !isPending && (
              <>
                {!isEditing && (
                  <button
                    className="edit-btn-fb"
                    style={{ marginTop: 18, width: '80%', display: 'block', marginLeft: 'auto', marginRight: 'auto' }}
                    onClick={() => setIsEditing(true)}
                    disabled={!schoolName}
                  >
                    Edit Profile
                  </button>
                )}
                {isEditing && (
                  <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
                    <button
                      className="save-btn-fb"
                      style={{ flex: 1 }}
                      onClick={() => {
                        handleUpdate();
                        setIsEditing(false);
                      }}
                      disabled={!schoolName}
                    >
                      Save Changes
                    </button>
                    <button
                      className="cancel-btn-fb"
                      style={{ flex: 1 }}
                      onClick={() => setIsEditing(false)}
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
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
                cursor: 'pointer',
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
                  const { proofFile, ...restForm } = form;
                  await setDoc(
                    doc(db, 'schools', schoolName, 'users', user.uid),
                    {
                      verificationStatus: 'pending',
                      verificationRequest: restForm,
                    },
                    { merge: true }
                  );
                  setVerificationStatus('pending');
                  setShowVerifyForm(false);
                  setActionMessage('Verification request sent! Please wait for admin approval.');
                } catch (err) {
                  setActionMessage('Failed to send verification request');
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

import React, { useEffect, useState, useCallback } from 'react';
import { getAuth, updateProfile, updateEmail } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import NavbarHome from '../components/NavbarHome';
import './Profile.css';

function Profile() {
  const auth = getAuth();
  const user = auth.currentUser;

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('student'); // Default role
  const [course, setCourse] = useState('');
  const [year, setYear] = useState('');
  const [department, setDepartment] = useState('');
  const [location, setLocation] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const fetchUserData = useCallback(async () => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(userRef);
      const data = docSnap.data() || {};
      setFullName(data.fullName || user.displayName || '');
      setEmail(data.email || user.email || '');
      setPhone(data.phone || '');
      setRole(data.role || 'student');
      setCourse(data.course || '');
      setYear(data.year || '');
      setDepartment(data.department || '');
      setLocation(data.location || '');
    }
  }, [user]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  const handleUpdate = async () => {
    if (!user) return;

    try {
      await updateProfile(user, { displayName: fullName });
      if (email !== user.email) {
        await updateEmail(user, email);
      }

      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        fullName,
        email,
        phone,
        role,
        course: role === 'student' ? course : '',
        year: role === 'student' ? year : '',
        department: role === 'teacher' ? department : '',
        location,
      }, { merge: true });

      alert('Profile updated successfully!');
      setIsEditing(false);
      fetchUserData(); // Refresh data
    } catch (error) {
      alert('Error updating profile: ' + error.message);
    }
  };

  return (
    <div className="about-page">
      <NavbarHome />
      <div className="about-container">
        <h1>My Profile</h1>
        <div style={styles.profileBox}>
          <div>
            <label>Full Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} disabled={!isEditing} />

            <label>Email</label>
            <input value={email} onChange={e => setEmail(e.target.value)} disabled={!isEditing} />

            <label>Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} disabled={!isEditing} />

            <label>Role</label>
            <select value={role} onChange={e => setRole(e.target.value)} disabled={!isEditing}>
              <option value="student">Student</option>
              <option value="teacher">Teacher</option>
              <option value="facilitator">Facilitator</option>
            </select>

            {role === 'student' && (
              <>
                <label>Course</label>
                <select value={course} onChange={e => setCourse(e.target.value)} disabled={!isEditing}>
                  <option value="">Select Course</option>
                  <option value="BSHM">BSHM</option>
                  <option value="BSIT">BSIT</option>
                  <option value="BSENTREP">BSENTREP</option>
                  <option value="BSED">BSED</option>
                </select>

                <label>Year</label>
                <select value={year} onChange={e => setYear(e.target.value)} disabled={!isEditing}>
                  <option value="">Select Year</option>
                  <option value="1st">1st</option>
                  <option value="2nd">2nd</option>
                  <option value="3rd">3rd</option>
                  <option value="4th">4th</option>
                </select>
              </>
            )}

            {role === 'teacher' && (
              <>
                <label>Department</label>
                <select value={department} onChange={e => setDepartment(e.target.value)} disabled={!isEditing}>
                  <option value="">Select Department</option>
                  <option value="BSHM">BSHM</option>
                  <option value="BSIT">BSIT</option>
                  <option value="BSENTREP">BSENTREP</option>
                  <option value="BSED">BSED</option>
                </select>
              </>
            )}

            {(role === 'student' || role === 'teacher' || role === 'facilitator') && (
              <>
                <label>Current Location</label>
                <input value={location} onChange={e => setLocation(e.target.value)} disabled={!isEditing} />
              </>
            )}

            {!isEditing ? (
              <button onClick={() => setIsEditing(true)}>Edit Profile</button>
            ) : (
              <div>
                <button onClick={handleUpdate}>Save Changes</button>
                <button onClick={() => {
                  setIsEditing(false);
                  fetchUserData(); // Cancel edits and restore previous values
                }}>Cancel</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const styles = {
  profileBox: {
    background: '#f9f9f9',
    padding: '20px',
    borderRadius: '10px'
  }
};

export default Profile;
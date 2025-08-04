import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase';
import NavbarAdmin from '../components/NavbarAdmin';
import './AdminApproval.css';

function AdminApproval() {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  const schoolName = user?.school;

  useEffect(() => {
    const fetchPending = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'schools', schoolName, 'users'),
          where('verificationStatus', '==', 'pending')
        );
        const snapshot = await getDocs(q);
        setPendingUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setActionMessage('Error loading pending verifications.');
      }
      setLoading(false);
    };
    if (schoolName) fetchPending();
  }, [schoolName]);

  const approveUser = async (userId) => {
    try {
      await updateDoc(doc(db, 'schools', schoolName, 'users', userId), { verificationStatus: 'verified' });
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
      setActionMessage('User approved.');
    } catch (err) {
      setActionMessage('Error approving user.');
    }
  };

  const rejectUser = async (userId) => {
    try {
      await updateDoc(doc(db, 'schools', schoolName, 'users', userId), { verificationStatus: 'rejected' });
      setPendingUsers(pendingUsers.filter(u => u.id !== userId));
      setActionMessage('User rejected.');
    } catch (err) {
      setActionMessage('Error rejecting user.');
    }
  };

  return (
    <>
      <NavbarAdmin />
      <div className="admin-approval-container">
        <h2>Pending User Verifications</h2>
        {actionMessage && <div className="admin-approval-message">{actionMessage}</div>}
        {loading ? (
          <div>Loading...</div>
        ) : pendingUsers.length === 0 ? (
          <p>No users pending verification.</p>
        ) : (
          <div className="approval-list">
            {pendingUsers.map(user => (
              <div className="approval-card" key={user.id}>
                <p><strong>Name:</strong> {user.fullName}</p>
                <p><strong>Email:</strong> {user.email}</p>
                {user.verificationRequest && (
                  <div style={{ marginBottom: 8 }}>
                    <strong>Request Details:</strong>
                    <pre style={{ background: "#f4f4f4", padding: 8, borderRadius: 4 }}>
                      {JSON.stringify(user.verificationRequest, null, 2)}
                    </pre>
                  </div>
                )}
                <div className="approval-actions">
                  <button onClick={() => approveUser(user.id)} className="approve-btn">Approve</button>
                  <button onClick={() => rejectUser(user.id)} className="reject-btn">Reject</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

export default AdminApproval;
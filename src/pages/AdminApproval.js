import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { db } from '../firebase';
import NavbarAdmin from '../components/NavbarAdmin';

function AdminApproval() {
  const [pendingFound, setPendingFound] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionMessage, setActionMessage] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));
  const schoolName = user?.school;

  useEffect(() => {
    const fetchPending = async () => {
      setLoading(true);
      try {
        const q = query(
          collection(db, 'schools', schoolName, 'FoundItems'),
          where('status', '==', 'pending')
        );
        const snapshot = await getDocs(q);
        setPendingFound(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (err) {
        setActionMessage('Error loading pending items.');
      }
      setLoading(false);
    };
    if (schoolName) fetchPending();
  }, [schoolName]);

  const approveItem = async (itemId) => {
    try {
      await updateDoc(doc(db, 'schools', schoolName, 'FoundItems', itemId), { status: 'approved' });
      setPendingFound(pendingFound.filter(item => item.id !== itemId));
      setActionMessage('Item approved.');
    } catch (err) {
      setActionMessage('Error approving item.');
    }
  };

  const rejectItem = async (itemId) => {
    try {
      await deleteDoc(doc(db, 'schools', schoolName, 'FoundItems', itemId));
      setPendingFound(pendingFound.filter(item => item.id !== itemId));
      setActionMessage('Item rejected and removed.');
    } catch (err) {
      setActionMessage('Error rejecting item.');
    }
  };

  return (
    <>
      <NavbarAdmin />
      <div className="admin-approval-container">
        <h2>Pending Found Items</h2>
        {actionMessage && <div className="admin-approval-message">{actionMessage}</div>}
        {loading ? (
          <div>Loading...</div>
        ) : pendingFound.length === 0 ? (
          <p>No items pending approval.</p>
        ) : (
          <div className="approval-list">
            {pendingFound.map(item => (
              <div className="approval-card" key={item.id}>
                <p><strong>Title:</strong> {item.title}</p>
                <p><strong>Description:</strong> {item.description}</p>
                {item.imageUrl && (
                  <img src={item.imageUrl} alt="Found item" style={{ maxWidth: 200, marginBottom: 8 }} />
                )}
                <div className="approval-actions">
                  <button onClick={() => approveItem(item.id)} className="approve-btn">Approve</button>
                  <button onClick={() => rejectItem(item.id)} className="reject-btn">Reject</button>
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
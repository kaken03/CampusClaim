import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc,addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import NavbarAdmin from '../components/AdminNavbar';
import './AdminApproval.css';

function AdminApproval() {
    const [pendingUsers, setPendingUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionMessage, setActionMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedUserIds, setExpandedUserIds] = useState(new Set());
    const user = JSON.parse(localStorage.getItem('user'));
    const schoolName = user?.school;
    

    useEffect(() => {
        const fetchPending = async () => {
            setLoading(true);
            try {
                if (!schoolName) {
                    console.warn("School name not found in localStorage. Cannot fetch pending users.");
                    setLoading(false);
                    return;
                }
                const q = query(
                    collection(db, 'schools', schoolName, 'users'),
                    where('verificationStatus', '==', 'pending')
                );
                const snapshot = await getDocs(q);
                setPendingUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                setActionMessage('Error loading pending verifications.');
                console.error("Error fetching pending users:", err);
            }
            setLoading(false);
        };
        fetchPending();
    }, [schoolName]);

    // Toggle function for the details
    const toggleDetails = (userId) => {
        setExpandedUserIds(prevIds => {
            const newIds = new Set(prevIds);
            if (newIds.has(userId)) {
                newIds.delete(userId);
            } else {
                newIds.add(userId);
            }
            return newIds;
        });
    };

    // Filter pending users based on search query
    const filteredUsers = pendingUsers.filter(user =>
        user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase())
    );

    // NEW: Directly handle approve/reject
    const handleAction = async (userId, action) => {
        if (!userId || !action) return;
        try {
            const userRef = doc(db, 'schools', schoolName, 'users', userId);

            if (action === 'approve') {
                await updateDoc(userRef, { verificationStatus: 'verified' });

                // 🔔 Add notification
                const notifRef = collection(db, 'schools', schoolName, 'users', userId, 'notifications');
                await addDoc(notifRef, {
                    message: "✅ Your verification request has been approved! You can now post lost items and comment.",
                    type: "verification",
                    timestamp: serverTimestamp(),
                    read: false,
                });

                setPendingUsers(pendingUsers.filter(u => u.id !== userId));
                setActionMessage('User approved.');

            } else if (action === 'reject') {
                await updateDoc(userRef, { verificationStatus: 'rejected' });

                // 🔔 Add notification
                const notifRef = collection(db, 'schools', schoolName, 'users', userId, 'notifications');
                await addDoc(notifRef, {
                    message: "❌ Your verification request has been rejected. Please review your details and try again.",
                    type: "verification",
                    timestamp: serverTimestamp(),
                    read: false,
                });

                setPendingUsers(pendingUsers.filter(u => u.id !== userId));
                setActionMessage('User rejected.');
            }
        } catch (err) {
            setActionMessage(`Error ${action}ing user.`);
            console.error(`Error ${action}ing user:`, err);
        }
    };

    return (
        <>
            <NavbarAdmin />
            <div className="admin-approval-container">
                <div className="admin-approval-header">
                    <h2>Pending User Verifications</h2>
                    <input
                        type="text"
                        className="admin-search-input"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                    />
                </div>
                {actionMessage && <div className="admin-approval-message">{actionMessage}</div>}
                {loading ? (
                    <div className="loading-state">Loading...</div>
                ) : filteredUsers.length === 0 ? (
                    <p className="no-users-message">
                        No users pending verification.
                    </p>
                ) : (
                    <div className="approval-list">
                        {filteredUsers.map(user => (
                            <div className="approval-card" key={user.id}>
                                <div className="card-header">
                                    <h4 className="user-name">{user.fullName}</h4>
                                    <p className="user-email">{user.email}</p>
                                </div>
                                {user.verificationRequest && (
                                    <div className="request-details-section">
                                        <button
                                            className="details-toggle-btn"
                                            onClick={() => toggleDetails(user.id)}
                                        >
                                            <span className="button-text">
                                                {expandedUserIds.has(user.id) ? 'Hide Request Details' : 'See Request Details'}
                                            </span>
                                            <span className="arrow-icon">
                                                {expandedUserIds.has(user.id) ? '▲' : '▼'}
                                            </span>
                                        </button>
                                        {expandedUserIds.has(user.id) && (
                                            <div className="request-details-content">
                                                {Object.entries(user.verificationRequest).map(([key, value]) => (
                                                    value && value !== '' && (
                                                        <p key={key}>
                                                            <strong>{key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:</strong> {value}
                                                        </p>
                                                    )
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                                <div className="approval-actions">
                                    <button onClick={() => handleAction(user.id, 'approve')} className="approve-btn">Approve</button>
                                    <button onClick={() => handleAction(user.id, 'reject')} className="reject-btn">Reject</button>
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

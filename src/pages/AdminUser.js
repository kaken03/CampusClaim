import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import './AdminUser.css';
import Navbar from '../components/NavbarAdmin';

export default function AdminUser() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'admins' or 'users'
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    // Get current logged in user's UID
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) {
        setCurrentUserId(user.uid);
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchUsers() {
      setLoading(true);
      const usersSnapshot = await getDocs(collection(db, 'users'));
      setUsers(usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    }
    fetchUsers();
  }, []);

  const handleBlock = async (userId, isBlocked) => {
    await updateDoc(doc(db, 'users', userId), { isBlocked: !isBlocked });
    setUsers(users.map(user => user.id === userId ? { ...user, isBlocked: !isBlocked } : user));
  };

  const handleDelete = async (userId) => {
    if (window.confirm("Are you sure you want to delete this user? This action is irreversible.")) {
      await deleteDoc(doc(db, 'users', userId));
      setUsers(users.filter(user => user.id !== userId));
    }
  };

  // Simple search filter
  const filteredUsers = users.filter(
    user =>
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.id?.toLowerCase().includes(search.toLowerCase())
  );

  // Separate admins and regular users
  const admins = filteredUsers.filter(user => user.role?.toLowerCase() === 'admin');
  const regularUsers = filteredUsers.filter(user => !user.role || user.role?.toLowerCase() !== 'admin');

  // ---- Active status logic ----
  const now = Date.now();
  // Consider users active if lastActive is within 5 minutes (300000 ms)
  const ACTIVE_THRESHOLD_MS = 5 * 60 * 1000;

  function getUserStatus(user) {
    const lastActiveTime =
      typeof user.lastActive === 'object' && user.lastActive.seconds
        ? user.lastActive.seconds * 1000
        : typeof user.lastActive === 'number'
          ? user.lastActive
          : null;
    // Optionally, you may want to ignore blocked users for "active" count
    if (user.isBlocked) return 'Blocked';
    if (lastActiveTime && now - lastActiveTime < ACTIVE_THRESHOLD_MS) return 'Active';
    return 'Inactive';
  }

  // Stats
  const totalUsers = users.length;
  const activeUsers = users.filter(
    user => !user.isBlocked && (
      (typeof user.lastActive === 'object' && user.lastActive.seconds && (now - user.lastActive.seconds * 1000 < ACTIVE_THRESHOLD_MS))
      ||
      (typeof user.lastActive === 'number' && (now - user.lastActive < ACTIVE_THRESHOLD_MS))
    )
  ).length;

  // Table rendering helper
  function renderTable(group, isAdminTable = false) {
    return (
      <table className="admin-users-table">
        <thead>
          <tr>
            <th>User ID</th>
            <th>Name</th>
            <th>Email</th>
            <th>Status</th>
            <th>Role</th>
            <th>Registered</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {group.map(user => (
            <tr key={user.id} className={user.isBlocked ? 'user-blocked-row' : ''}>
              <td>{user.id}</td>
              <td>{user.name || '-'}</td>
              <td>{user.email || '-'}</td>
              <td>
                <span className={
                  getUserStatus(user) === 'Blocked' ? 'status-blocked' :
                  getUserStatus(user) === 'Active' ? 'status-active' :
                  'status-inactive'
                }>
                  {getUserStatus(user)}
                </span>
              </td>
              <td>{user.role || 'User'}</td>
              <td>{user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : '-'}</td>
              <td>
                {isAdminTable && user.id === currentUserId ? (
                  <span style={{ color: "#888" }}>It's You</span>
                ) : (
                  <>
                    <button
                      className={user.isBlocked ? 'unblock-btn' : 'block-btn'}
                      onClick={() => handleBlock(user.id, user.isBlocked)}
                    >
                      {user.isBlocked ? 'Unblock' : 'Block'}
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDelete(user.id)}
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
          {group.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', color: '#777' }}>
                No users found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="admin-users-container">
        <h2>User & Admin Management</h2>
        <div style={{ marginBottom: 18, fontWeight: 600, color: '#263238' }}>
          Total Users: {totalUsers} | Active Users: {activeUsers}
        </div>
        <input
          className="admin-user-search"
          type="text"
          placeholder="Search by name, email, or ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Tabs */}
        <div className="admin-user-tabs">
          <button
            className={activeTab === 'users' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab('users')}
          >
            Users
          </button>
          <button
            className={activeTab === 'admins' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => setActiveTab('admins')}
          >
            Admins
          </button>
        </div>

        {loading ? (
          <div className="admin-user-loading">Loading users...</div>
        ) : (
          <>
            {activeTab === 'admins' && (
              <>
                <h3 style={{ marginTop: '24px' }}>Admins</h3>
                {renderTable(admins, true)}
              </>
            )}
            {activeTab === 'users' && (
              <>
                <h3 style={{ marginTop: '24px' }}>Users</h3>
                {renderTable(regularUsers, false)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
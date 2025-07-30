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
  const [activeTab, setActiveTab] = useState('users');
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) setCurrentUserId(user.uid);
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

  const filteredUsers = users.filter(
    user =>
      user.name?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.id?.toLowerCase().includes(search.toLowerCase())
  );

  const admins = filteredUsers.filter(user => user.role?.toLowerCase() === 'admin');
  const regularUsers = filteredUsers.filter(user => !user.role || user.role?.toLowerCase() !== 'admin');

  const now = Date.now();
  const ACTIVE_THRESHOLD_MS = 5 * 60 * 1000;

  function getUserStatus(user) {
    const lastActiveTime =
      typeof user.lastActive === 'object' && user.lastActive?.seconds
        ? user.lastActive.seconds * 1000
        : typeof user.lastActive === 'number'
          ? user.lastActive
          : null;
    if (user.isBlocked) return 'Blocked';
    if (lastActiveTime && now - lastActiveTime < ACTIVE_THRESHOLD_MS) return 'Active';
    return 'Inactive';
  }

  const totalUsers = users.length;
  const activeUsers = users.filter(
    user => !user.isBlocked && (
      (typeof user.lastActive === 'object' && user.lastActive?.seconds && (now - user.lastActive.seconds * 1000 < ACTIVE_THRESHOLD_MS))
      ||
      (typeof user.lastActive === 'number' && (now - user.lastActive < ACTIVE_THRESHOLD_MS))
    )
  ).length;

  // RESPONSIVE: If mobile, show cards instead of table
  function renderCards(group, isAdminTable = false) {
    return (
      <div className="admin-users-cards">
        {group.length === 0 ? (
          <div className="admin-users-card-empty">No users found.</div>
        ) : (
          group.map(user => (
            <div key={user.id} className={`admin-users-card ${user.isBlocked ? 'user-blocked-card' : ''}`}>
              <div className="admin-users-card-row">
                <span className="admin-users-card-label">User ID:</span>
                <span className="admin-users-card-value">{user.id}</span>
              </div>
              <div className="admin-users-card-row">
                <span className="admin-users-card-label">Name:</span>
                <span className="admin-users-card-value">{user.name || '-'}</span>
              </div>
              <div className="admin-users-card-row">
                <span className="admin-users-card-label">Email:</span>
                <span className="admin-users-card-value">{user.email || '-'}</span>
              </div>
              <div className="admin-users-card-row">
                <span className="admin-users-card-label">Status:</span>
                <span className={
                  getUserStatus(user) === 'Blocked' ? 'status-blocked' :
                  getUserStatus(user) === 'Active' ? 'status-active' :
                  'status-inactive'
                }>
                  {getUserStatus(user)}
                </span>
              </div>
              <div className="admin-users-card-row">
                <span className="admin-users-card-label">Role:</span>
                <span className="admin-users-card-value">{user.role || 'User'}</span>
              </div>
              <div className="admin-users-card-row">
                <span className="admin-users-card-label">Registered:</span>
                <span className="admin-users-card-value">{user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : '-'}</span>
              </div>
              <div className="admin-users-card-actions">
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
              </div>
            </div>
          ))
        )}
      </div>
    );
  }

  // Table or card depending on screen width
  function renderTableOrCards(group, isAdminTable = false) {
    // Use CSS to show/hide table/cards, always render both for simplicity
    return (
      <>
        <div className="admin-users-table-wrapper">
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
        </div>
        <div className="admin-users-cards-wrapper">
          {renderCards(group, isAdminTable)}
        </div>
      </>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="admin-users-container">
        <h2>User & Admin Management</h2>
        <div className="admin-users-stats">
          <span>Total Users: <b>{totalUsers}</b></span>
          <span>Active Users: <b>{activeUsers}</b></span>
        </div>
        <input
          className="admin-user-search"
          type="text"
          placeholder="Search by name, email, or ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
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
                <h3 className="admin-users-group-title">Admins</h3>
                {renderTableOrCards(admins, true)}
              </>
            )}
            {activeTab === 'users' && (
              <>
                <h3 className="admin-users-group-title">Users</h3>
                {renderTableOrCards(regularUsers, false)}
              </>
            )}
          </>
        )}
      </div>
    </div>
  );
}
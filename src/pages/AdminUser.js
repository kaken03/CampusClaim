import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import './AdminUser.css'; // This CSS file will be provided next
import Navbar from '../components/NavbarAdmin';

export default function AdminUser() {
  const [users, setUsers] = useState([]); // Stores non-admin users
  const [admins, setAdmins] = useState([]); // Stores admin users
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('users'); // 'users' or 'admins'
  const [currentUserId, setCurrentUserId] = useState(null);
  // State for user category filter within the 'users' tab
  const [userCategoryFilter, setUserCategoryFilter] = useState('all'); // 'all', 'verified', 'unverified'

  // State for user statistics (non-admin users only)
  const [totalNonAdminUsers, setTotalNonAdminUsers] = useState(0);
  const [verifiedNonAdminUsers, setVerifiedNonAdminUsers] = useState(0);
  const [unverifiedNonAdminUsers, setUnverifiedNonAdminUsers] = useState(0);

  // Get admin's school from localStorage for Firestore path
  const userFromLocalStorage = JSON.parse(localStorage.getItem('user'));
  const schoolName = userFromLocalStorage?.school;

  // Effect to get current user ID for "It's You" label
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(user => {
      if (user) setCurrentUserId(user.uid);
    });
    return () => unsubscribe();
  }, []);

  // Effect to fetch all users and process them into admin/non-admin lists
  useEffect(() => {
    async function fetchAllUsersAndProcess() {
      setLoading(true);
      if (!schoolName) {
        console.warn("School name not found in localStorage. Cannot fetch users.");
        setLoading(false);
        return;
      }

      try {
        const usersRef = collection(db, 'schools', schoolName, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const allUsers = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        const nonAdmins = [];
        const adminsList = [];
        let verifiedCount = 0;

        allUsers.forEach(user => {
          if (user.role === 'admin') {
            adminsList.push(user);
          } else {
            nonAdmins.push(user);
            if (user.verificationStatus === 'verified') {
              verifiedCount++;
            }
          }
        });

        setUsers(nonAdmins);
        setAdmins(adminsList);
        setTotalNonAdminUsers(nonAdmins.length);
        setVerifiedNonAdminUsers(verifiedCount);
        setUnverifiedNonAdminUsers(nonAdmins.length - verifiedCount);

      } catch (error) {
        console.error("Error fetching users:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchAllUsersAndProcess();
  }, [schoolName]); // Re-run effect if schoolName changes

  // Handles blocking/unblocking a user
  const handleBlock = async (userId, isBlocked) => {
    try {
      const userDocRef = doc(db, 'schools', schoolName, 'users', userId);
      await updateDoc(userDocRef, { isBlocked: !isBlocked });
      
      setUsers(prevUsers => prevUsers.map(user => user.id === userId ? { ...user, isBlocked: !isBlocked } : user));
      setAdmins(prevAdmins => prevAdmins.map(admin => admin.id === userId ? { ...admin, isBlocked: !isBlocked } : admin));
    } catch (error) {
      console.error("Error blocking/unblocking user:", error);
    }
  };

  // Handles deleting a user
  const handleDelete = async (userId) => {
    // IMPORTANT: Replace window.confirm with a custom modal UI for user confirmation
    if (window.confirm("Are you sure you want to delete this user? This action is irreversible.")) {
      try {
        const userDocRef = doc(db, 'schools', schoolName, 'users', userId);
        await deleteDoc(userDocRef);
        
        const newNonAdminUsers = users.filter(user => user.id !== userId);
        const newAdmins = admins.filter(admin => admin.id !== userId);
        
        setUsers(newNonAdminUsers);
        setAdmins(newAdmins);

        const newVerifiedCount = newNonAdminUsers.filter(u => u.verificationStatus === 'verified').length;
        setTotalNonAdminUsers(newNonAdminUsers.length);
        setVerifiedNonAdminUsers(newVerifiedCount);
        setUnverifiedNonAdminUsers(newNonAdminUsers.length - newVerifiedCount);

      } catch (error) {
        console.error("Error deleting user:", error);
      }
    }
  };

  // Filters users and admins based on search input (fullName, email, ID)
  const filteredUsers = users.filter(
    user =>
      user.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      user.email?.toLowerCase().includes(search.toLowerCase()) ||
      user.id?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAdmins = admins.filter(
    admin =>
      admin.fullName?.toLowerCase().includes(search.toLowerCase()) ||
      admin.email?.toLowerCase().includes(search.toLowerCase()) ||
      admin.id?.toLowerCase().includes(search.toLowerCase())
  );

  // Determines user status for display
  function getUserStatus(user) {
    if (user.isBlocked) return 'Blocked';
    if (user.verificationStatus === 'verified') return 'Verified';
    return 'Unverified'; // Default to unverified if not blocked and not explicitly verified
  }

  // Filters non-admin users based on the selected category (all, verified, unverified)
  const filteredUsersByCategory = filteredUsers.filter(user => {
    if (userCategoryFilter === 'all') {
      return true;
    } else if (userCategoryFilter === 'verified') {
      return user.verificationStatus === 'verified';
    } else if (userCategoryFilter === 'unverified') {
      return user.verificationStatus !== 'verified';
    }
    return true; // Fallback
  });

  // Renders user data as cards for mobile view
  function renderCards(group, isAdminTable = false) {
    return (
      <div className="admin-users-cards-grid">
        {group.length === 0 ? (
          <div className="admin-users-empty-state">No users found.</div>
        ) : (
          group.map(user => (
            <div key={user.id} className={`user-card ${user.isBlocked ? 'user-card-blocked' : ''}`}>
              <div className="user-card-header">
                <h4 className="user-card-name">{user.fullName || 'N/A'}</h4>
                <p className="user-card-email">{user.email || 'N/A'}</p>
              </div>
              <div className="user-card-details">
                <p><strong>User ID:</strong> {user.id}</p>
                <p><strong>Role:</strong> {user.role || 'User'}</p>
                <p><strong>Registered:</strong> {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
                
                {!isAdminTable && ( // Status only for non-admins
                  <p>
                    <strong>Status:</strong> 
                    <span className={`user-status-badge status-${getUserStatus(user).toLowerCase()}`}>
                      {getUserStatus(user)}
                    </span>
                  </p>
                )}
              </div>
              
              {!isAdminTable && ( // Actions only for non-admins
                <div className="user-card-actions">
                  {user.id === currentUserId ? (
                    <span className="current-user-tag">It's You</span>
                  ) : (
                    <>
                      <button
                        className={`action-btn ${user.isBlocked ? 'action-btn-unblock' : 'action-btn-block'}`}
                        onClick={() => handleBlock(user.id, user.isBlocked)}
                      >
                        {user.isBlocked ? 'Unblock' : 'Block'}
                      </button>
                      <button
                        className="action-btn action-btn-delete"
                        onClick={() => handleDelete(user.id)}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    );
  }

  // Renders user data as a table for desktop view
  function renderTable(group, isAdminTable = false) {
    return (
      <div className="admin-users-table-wrapper">
        <table className="admin-users-table">
          <thead>
            <tr>
              <th>User ID</th>
              <th>Name</th>
              <th>Email</th>
              {!isAdminTable && <th>Status</th>} {/* Status header only for non-admins */}
              <th>Role</th>
              <th>Registered</th>
              {!isAdminTable && <th>Actions</th>} {/* Actions header only for non-admins */}
            </tr>
          </thead>
          <tbody>
            {group.length === 0 ? (
              <tr>
                <td colSpan={isAdminTable ? 5 : 7} className="empty-table-cell">No users found.</td>
              </tr>
            ) : (
              group.map(user => (
                <tr key={user.id} className={user.isBlocked ? 'user-row-blocked' : ''}>
                  <td>{user.id}</td>
                  <td>{user.fullName || '-'}</td>
                  <td>{user.email || '-'}</td>
                  {!isAdminTable && ( // Status cell only for non-admins
                    <td>
                      <span className={`user-status-badge status-${getUserStatus(user).toLowerCase()}`}>
                        {getUserStatus(user)}
                      </span>
                    </td>
                  )}
                  <td>{user.role || 'User'}</td>
                  <td>{user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : '-'}</td>
                  {!isAdminTable && ( // Actions cell only for non-admins
                    <td>
                      {user.id === currentUserId ? (
                        <span className="current-user-tag">It's You</span>
                      ) : (
                        <div className="table-actions-buttons">
                          <button
                            className={`action-btn ${user.isBlocked ? 'action-btn-unblock' : 'action-btn-block'}`}
                            onClick={() => handleBlock(user.id, user.isBlocked)}
                          >
                            {user.isBlocked ? 'Unblock' : 'Block'}
                          </button>
                          <button
                            className="action-btn action-btn-delete"
                            onClick={() => handleDelete(user.id)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </td>
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="admin-page-container">
        <header className="admin-page-header">
          <h1>User & Admin Management</h1>
        </header>

        <div className="admin-content-area">
          <div className="admin-sidebar">
            <div className="admin-tabs-nav">
              <button
                className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                Users
              </button>
              <button
                className={`tab-button ${activeTab === 'admins' ? 'active' : ''}`}
                onClick={() => setActiveTab('admins')}
              >
                Admins
              </button>
            </div>
            
            {activeTab === 'users' && (
              <div className="user-filter-section">
                <h4 className="filter-section-title">Filter Users</h4>
                <div className="filter-buttons-group">
                  <button
                    className={`filter-button ${userCategoryFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setUserCategoryFilter('all')}
                  >
                    All Users ({totalNonAdminUsers})
                  </button>
                  <button
                    className={`filter-button ${userCategoryFilter === 'verified' ? 'active' : ''}`}
                    onClick={() => setUserCategoryFilter('verified')}
                  >
                    Verified ({verifiedNonAdminUsers})
                  </button>
                  <button
                    className={`filter-button ${userCategoryFilter === 'unverified' ? 'active' : ''}`}
                    onClick={() => setUserCategoryFilter('unverified')}
                  >
                    Unverified ({unverifiedNonAdminUsers})
                  </button>
                </div>
              </div>
            )}
          </div>

          <main className="admin-main-content">
            <div className="search-bar-container">
              <input
                className="search-input"
                type="text"
                placeholder="Search by name, email, or ID..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>

            {loading ? (
              <div className="loading-state">Loading users...</div>
            ) : (
              <>
                {activeTab === 'admins' && (
                  <section className="admin-list-section">
                    <h3 className="section-title">Administrators</h3>
                    {renderTable(filteredAdmins, true)}
                    {renderCards(filteredAdmins, true)} {/* Render cards for mobile */}
                  </section>
                )}
                {activeTab === 'users' && (
                  <section className="user-list-section">
                    <h3 className="section-title">Regular Users</h3>
                    {renderTable(filteredUsersByCategory, false)}
                    {renderCards(filteredUsersByCategory, false)} {/* Render cards for mobile */}
                  </section>
                )}
              </>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}

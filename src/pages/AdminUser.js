import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { collection, getDocs, updateDoc,  doc, getDoc } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import './AdminUser.css';
import Navbar from '../components/AdminNavbar';
import AdminUserAnalytics from '../components/AdminUserAnalytics';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsisH } from '@fortawesome/free-solid-svg-icons';
import ReactDOM from 'react-dom';

// Modal component for confirmations and info messages
const ActionModal = ({ message, onConfirm, onCancel, showConfirm = false }) => {
  if (!message) return null;
  return (
    <div className="ui-modal-overlay">
      <div className="modal-content">
        <p>{message}</p>
        {showConfirm ? (
          <div className="modal-actions">
            <button onClick={onConfirm} className="action-btn-confirm">Confirm</button>
            <button onClick={onCancel} className="action-btn-cancel">Cancel</button>
          </div>
        ) : (
          <button onClick={onCancel} className="modal-close-btn">OK</button>
        )}
      </div>
    </div>
  );
};

// Details Modal Component
const DetailsModal = ({ user, onClose }) => {
  if (!user) return null;
  return (
    <div className="modal-overlay">
      <div className="modal-content user-details-modal">
        <h4 className="modal-title">User Details</h4>
        <p><strong>Full Name:</strong> {user.fullName || 'N/A'}</p>
        <p><strong>Email:</strong> {user.email || 'N/A'}</p>
        <p><strong>User ID:</strong> {user.id}</p>
        <p><strong>Registered:</strong> {user.createdAt?.seconds ? new Date(user.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
        <button onClick={onClose} className="modal-close-btn">Close</button>
      </div>
    </div>
  );
};

// Ellipsis Menu Component
const EllipsisMenu = ({ user, currentUser, onAction, onDetails, onClose, position }) => {
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        onClose();
      }
    };
    const handleScrollOrResize = () => {
      onClose(); // Close menu on scroll/resize for simplicity
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('scroll', handleScrollOrResize, true);
    window.addEventListener('resize', handleScrollOrResize);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScrollOrResize, true);
      window.removeEventListener('resize', handleScrollOrResize);
    };
  }, [onClose]);

  // Smart positioning: adjust if menu would go off screen
  const menuWidth = 180;
  const menuHeight = 220;
  let top = position.top;
  let left = position.left;
  if (window.innerHeight - top < menuHeight) {
    top = window.innerHeight - menuHeight - 12;
  }
  if (window.innerWidth - left < menuWidth) {
    left = window.innerWidth - menuWidth - 12;
  }

  const menuStyle = {
    position: 'fixed',
    top: Math.max(top, 12),
    left: Math.max(left, 12),
    width: menuWidth,
    maxHeight: menuHeight,
    zIndex: 2000,
    background: '#fff',
    borderRadius: '10px',
    boxShadow: '0 4px 24px rgba(24,119,242,0.14)',
    overflowY: 'auto',
    padding: '8px 0',
    display: 'flex',
    flexDirection: 'column',
    gap: '2px',
  };

  const isMainAdmin = currentUser.role === "main-admin";
  const isTargetAdmin = user.role === "admin" || user.role === "main-admin";
  const isTargetMainAdmin = user.role === "main-admin";
  const isCurrentUser = user.id === currentUser.id;

  return ReactDOM.createPortal(
    <div
      className="ellipsis-dropdown-menu"
      ref={menuRef}
      style={menuStyle}
    >
      <button onClick={() => { onDetails(user); onClose(); }} className="ellipsis-menu-item">
        Details
      </button>
      {!isCurrentUser && (
        <>
          {isMainAdmin && !isTargetAdmin && (
            <button onClick={() => { onAction('promote', user.id); onClose(); }} className="ellipsis-menu-item promote-option">
              Promote to Admin
            </button>
          )}
          {isMainAdmin && isTargetAdmin && !isTargetMainAdmin && (
            <button onClick={() => { onAction('demote', user.id); onClose(); }} className="ellipsis-menu-item demote-option">
              Demote to User
            </button>
          )}
          {!isTargetMainAdmin && (
            <>
              <button onClick={() => { onAction('block', user.id, user.isBlocked); onClose(); }} className="ellipsis-menu-item block-option">
                {user.isBlocked ? 'Unblock User' : 'Block User'}
              </button>
              {/* <button onClick={() => { onAction('delete', user.id); onClose(); }} className="ellipsis-menu-item delete-option">
                Delete User
              </button> */}
            </>
          )}
        </>
      )}
    </div>,
    document.body
  );
};

export default function AdminUser() {
  const [users, setUsers] = useState([]);
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('users');
  const [currentUser, setCurrentUser] = useState(null);
  const [userCategoryFilter, setUserCategoryFilter] = useState('all');
  const [totalNonAdminUsers, setTotalNonAdminUsers] = useState(0);
  const [verifiedNonAdminUsers, setVerifiedNonAdminUsers] = useState(0);
  const [unverifiedNonAdminUsers, setUnverifiedNonAdminUsers] = useState(0);
  const [modalState, setModalState] = useState({
    message: '',
    showConfirm: false,
    action: null,
    targetId: null,
    targetUser: null,
  });
  const [detailsModalUser, setDetailsModalUser] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [activeEllipsisMenu, setActiveEllipsisMenu] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 }); // New state for positioning

  const userFromLocalStorage = JSON.parse(localStorage.getItem('user'));
  const schoolName = userFromLocalStorage?.school;

  // Fetch current user info
  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'schools', schoolName, 'users', user.uid));
        if (userDoc.exists()) {
          setCurrentUser({ id: user.uid, role: userDoc.data().role, ...userDoc.data() });
        }
      }
    });
    return () => unsubscribe();
  }, [schoolName]);

  // Fetch all users & admins
  useEffect(() => {
    async function fetchAllUsersAndProcess() {
      setLoading(true);
      if (!schoolName) {
        setLoading(false);
        return;
      }

      try {
        const usersRef = collection(db, 'schools', schoolName, 'users');
        const usersSnapshot = await getDocs(usersRef);
        const allUsers = usersSnapshot.docs.map(docSnap => ({ id: docSnap.id, ...docSnap.data() }));

        const nonAdmins = [];
        const adminsList = [];
        let verifiedCount = 0;

        allUsers.forEach(user => {
          if (user.role === 'admin' || user.role === 'main-admin') {
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
  }, [schoolName]);

  const showConfirmModal = (message, action, targetId, targetUser = null) => {
    setModalState({ message, showConfirm: true, action, targetId, targetUser });
  };

  const showInfoModal = (message, title = 'Notification') => {
    setModalState({ message, showConfirm: false, action: null, targetId: null, targetUser: null, title });
  };

  const closeModal = () => {
    setModalState({ message: '', showConfirm: false, action: null, targetId: null, targetUser: null });
    setDetailsModalUser(null);
  };

  const handleBlock = async (userId, isBlocked, role) => {
    if (isProcessing) return;
    if (role === "main-admin") {
      showInfoModal("❌ Main Admin cannot be blocked.");
      return;
    }
    setIsProcessing(true);
    try {
      const userDocRef = doc(db, 'schools', schoolName, 'users', userId);
      await updateDoc(userDocRef, { isBlocked: !isBlocked });
      setUsers(prev => prev.map(u => u.id === userId ? { ...u, isBlocked: !isBlocked } : u));
      setAdmins(prev => prev.map(a => a.id === userId ? { ...a, isBlocked: !isBlocked } : a));
      
    } catch (error) {
      console.error("Error blocking/unblocking user:", error);
      showInfoModal("An error occurred.");
    } finally {
      setIsProcessing(false);
    }
  };

  // const handleDelete = (userId, role) => {
  //   if (isProcessing) return;
  //   if (role === "main-admin") {
  //     showInfoModal("❌ Main Admin cannot be deleted.");
  //     return;
  //   }
  //   showConfirmModal("Are you sure you want to delete this user? This action is irreversible.", 'delete', userId);
  // };
  
  // const confirmDelete = async (userId) => {
  //   setIsProcessing(true);
  //   try {
  //     const userDocRef = doc(db, 'schools', schoolName, 'users', userId);
  //     await deleteDoc(userDocRef);
  //     const isUser = users.some(u => u.id === userId);
  //     if (isUser) {
  //       setUsers(prev => {
  //           const updatedUsers = prev.filter(u => u.id !== userId);
  //           const newVerifiedCount = updatedUsers.filter(u => u.verificationStatus === 'verified').length;
  //           setTotalNonAdminUsers(updatedUsers.length);
  //           setVerifiedNonAdminUsers(newVerifiedCount);
  //           setUnverifiedNonAdminUsers(updatedUsers.length - newVerifiedCount);
  //           return updatedUsers;
  //       });
  //     } else {
  //       setAdmins(prev => prev.filter(a => a.id !== userId));
  //     }
  //     showInfoModal("✅ User has been successfully deleted.");
  //   } catch (error) {
  //     console.error("Error deleting user:", error);
  //     showInfoModal("An error occurred while deleting the user.");
  //   } finally {
  //     setIsProcessing(false);
  //   }
  // };

  const handlePromoteToAdmin = (targetUserId) => {
    if (isProcessing) return;
    if (currentUser.role !== "main-admin") {
      showInfoModal("❌ Only the Main Admin can promote users.");
      return;
    }
    const userToPromote = users.find(u => u.id === targetUserId);
    if (!userToPromote) {
      showInfoModal("This user is no longer available to be promoted.");
      return;
    }
    showConfirmModal(`Are you sure you want to promote ${userToPromote.fullName} to Admin?`, 'promote', targetUserId, userToPromote);
  };

  const confirmPromote = async (targetUserId, targetUser) => {
    setIsProcessing(true);
    try {
      const targetDoc = doc(db, 'schools', schoolName, 'users', targetUserId);
      await updateDoc(targetDoc, { role: "admin" });
      setUsers(prev => prev.filter(u => u.id !== targetUserId));
      setAdmins(prev => [...prev, { ...targetUser, role: "admin" }]);
      showInfoModal(`✅ ${targetUser.fullName} has been successfully promoted to Admin.`);
    } catch (error) {
      console.error("Error promoting user:", error);
      showInfoModal("An error occurred while promoting the user.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDemoteAdmin = (targetUserId) => {
    if (isProcessing) return;
    if (currentUser.role !== "main-admin") {
      showInfoModal("❌ Only the Main Admin can demote admins.");
      return;
    }
    const demotedUser = admins.find(a => a.id === targetUserId);
    if (demotedUser?.role === "main-admin") {
      showInfoModal("❌ Main Admin cannot be demoted.");
      return;
    }
    showConfirmModal(`Are you sure you want to demote ${demotedUser.fullName} to User?`, 'demote', targetUserId, demotedUser);
  };

  const confirmDemote = async (targetUserId, targetUser) => {
    setIsProcessing(true);
    try {
      const targetDoc = doc(db, 'schools', schoolName, 'users', targetUserId);
      await updateDoc(targetDoc, { role: "user" });
      setAdmins(prev => prev.filter(a => a.id !== targetUserId));
      setUsers(prev => [...prev, { ...targetUser, role: "user" }]);
    } catch (error) {
      console.error("Error demoting admin:", error);
      showInfoModal("An error occurred while demoting the admin.");
    } finally {
      setIsProcessing(false);
    }
  };

  const handleModalAction = () => {
    if (modalState.action === 'promote') {
      confirmPromote(modalState.targetId, modalState.targetUser);
    } else if (modalState.action === 'demote') {
      confirmDemote(modalState.targetId, modalState.targetUser);
    // } else if (modalState.action === 'delete') {
    //   confirmDelete(modalState.targetId);
    } else if (modalState.action === 'block') {
      handleBlock(modalState.targetId, modalState.targetUser.isBlocked, modalState.targetUser.role);
    }
    closeModal();
  };

  const handleEllipsisAction = (action, userId, isBlocked = null) => {
    const user = users.find(u => u.id === userId) || admins.find(a => a.id === userId);
    if (!user) {
      showInfoModal("User not found.");
      return;
    }
    if (action === 'promote') {
      handlePromoteToAdmin(userId);
    } else if (action === 'demote') {
      handleDemoteAdmin(userId);
    } else if (action === 'block') {
      showConfirmModal(`Are you sure you want to ${isBlocked ? 'unblock' : 'block'} this user?`, 'block', userId, user);
    } 
    // else if (action === 'delete') {
    //   handleDelete(userId, user.role);
    // }
  };

  const handleShowDetails = (user) => {
    setDetailsModalUser(user);
  };

  const handleEllipsisClick = (event, user) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setMenuPosition({
      top: rect.top + rect.height + 10,
      left: rect.left + rect.width - 180,
    });
    setActiveEllipsisMenu(user);
  };

  const filteredUsers = users.filter(
    u => u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          u.email?.toLowerCase().includes(search.toLowerCase()) ||
          u.id?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredAdmins = admins.filter(
    a => a.fullName?.toLowerCase().includes(search.toLowerCase()) ||
          a.email?.toLowerCase().includes(search.toLowerCase()) ||
          a.id?.toLowerCase().includes(search.toLowerCase())
  );

  function getUserStatus(user) {
    if (user.isBlocked) return 'Blocked';
    if (user.verificationStatus === 'verified') return 'Verified';
    return 'Unverified';
  }

  const filteredUsersByCategory = filteredUsers.filter(user => {
    if (userCategoryFilter === 'all') return true;
    if (userCategoryFilter === 'verified') return user.verificationStatus === 'verified';
    if (userCategoryFilter === 'unverified') return user.verificationStatus !== 'verified';
    if (userCategoryFilter === 'blocked') return user.isBlocked;
    return true;
  });

  function renderCards(group, isAdminTable = false) {
    if (!currentUser) return null; // Wait for currentUser to be fetched

    return (
        <div className="admin-users-cards-grid">
      {group.length === 0 ? (
        <div className="admin-users-empty-state">No users found.</div>
      ) : (
        group.map(user => (
          <div key={user.id} className={`user-card ${user.isBlocked ? 'user-card-blocked' : ''}`}>
            <div className="user-card-header">
              <div className="user-card-info">
                <h4 className="user-card-name" title={user.fullName}>
                  {user.fullName && user.fullName.length > 20
                    ? user.fullName.slice(0, 20) + '...'
                    : user.fullName || 'N/A'}
                </h4>
                <p className="user-card-email" title={user.email}>
                  {user.email && user.email.length > 30
                    ? user.email.slice(0, 30) + '...'
                    : user.email || 'N/A'}
                </p>
              </div>
              <button
                className="ellipsis-button"
                onClick={(e) => handleEllipsisClick(e, user)}
              >
                <FontAwesomeIcon icon={faEllipsisH} />
              </button>
            </div>
            
            <div className="user-card-details-summary">
              {!isAdminTable && (
                <p>
                  <strong>Status:</strong>
                  <span className={`user-status-badge status-${getUserStatus(user).toLowerCase()}`}>
                    {getUserStatus(user)}
                  </span>
                </p>
              )}
              {user.id === currentUser.id && (
                <span className="current-user-tag">It's You</span>
              )}
            </div>
          </div>
        ))
      )}
    </div>
    );
  }

  return (
    <div>
      <Navbar />
      <div className="admin-page-container">
        <header className="admin-page-header">
          <h1>User Management</h1>
        </header>
        <div className="admin-content-area">
          <div className="admin-sidebar">
            <div className="admin-tabs-nav">
              <button
                className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                Analytics 📊
              </button>
              <button
                className={`tab-button ${activeTab === 'users' ? 'active' : ''}`}
                onClick={() => setActiveTab('users')}
              >
                Users
              </button>
              {currentUser?.role === "main-admin" && (
                <button
                  className={`tab-button ${activeTab === 'admins' ? 'active' : ''}`}
                  onClick={() => setActiveTab('admins')}
                >
                  Admins
                </button>
              )}
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
                  <button
                  className={`filter-button ${userCategoryFilter === 'blocked' ? 'active' : ''}`}
                  onClick={() => setUserCategoryFilter('blocked')}
                >
                  Blocked ({users.filter(u => u.isBlocked).length})
                </button>
                </div>
              </div>
            )}
          </div>

          <main className="admin-main-content">
            {activeTab !== 'analytics' && (
              <div className="search-bar-container">
                <input
                  className="search-input"
                  type="text"
                  placeholder="Search by name, email, or ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            )}

            {loading ? (
              <div className="loading-state">Loading users...</div>
            ) : (
              <>
                {activeTab === 'analytics' && (
                  <section className="analytics-section">
                    <AdminUserAnalytics users={users} />
                  </section>
                )}
                {activeTab === 'admins' && (
                  <section className="admin-list-section">
                    <h3 className="section-title">Administrators</h3>
                    {renderCards(filteredAdmins, true)}
                  </section>
                )}
                {activeTab === 'users' && (
                  <section className="user-list-section">
                    <h3 className="section-title">Regular Users</h3>
                    {renderCards(filteredUsersByCategory, false)}
                  </section>
                )}
              </>
            )}
          </main>
        </div>
      </div>
      <ActionModal
        message={modalState.message}
        onConfirm={handleModalAction}
        onCancel={closeModal}
        showConfirm={modalState.showConfirm}
        title={modalState.title}
      />
      <DetailsModal user={detailsModalUser} onClose={closeModal} />
      {activeEllipsisMenu && (
        <EllipsisMenu
          user={activeEllipsisMenu}
          currentUser={currentUser}
          onAction={handleEllipsisAction}
          onDetails={handleShowDetails}
          onClose={() => setActiveEllipsisMenu(null)}
          position={menuPosition}
        />
      )}
    </div>
  );
}
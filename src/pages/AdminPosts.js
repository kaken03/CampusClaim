import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import Navbar from '../components/AdminNavbar';
import AdminPostsAnalytics from '../components/AdminPostsAnalytics';
import './AdminPosts.css';

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('all'); // all | lost | found | analytics
  const [postCategoryFilter, setPostCategoryFilter] = useState('all'); // all | claimed | unclaimed

  const userFromLocalStorage = JSON.parse(localStorage.getItem('user'));
  const schoolName = userFromLocalStorage?.school;

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      if (!schoolName) {
        console.warn("School name not found in localStorage. Cannot fetch posts.");
        setLoading(false);
        return;
      }

      try {
        const foundSnapshot = await getDocs(collection(db, 'schools', schoolName, 'FoundItems'));
        const lostSnapshot = await getDocs(collection(db, 'schools', schoolName, 'LostItems'));

        const foundPosts = foundSnapshot.docs.map(docSnap => ({
          ...docSnap.data(),
          id: docSnap.id,
          collection: 'FoundItems'
        }));
        const lostPosts = lostSnapshot.docs.map(docSnap => ({
          ...docSnap.data(),
          id: docSnap.id,
          collection: 'LostItems'
        }));

        setPosts([...foundPosts, ...lostPosts]);
      } catch (error) {
        console.error("Error fetching posts:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchPosts();
  }, [schoolName]);

  const handleBlock = async (postId, isBlocked, collectionName) => {
    try {
      await updateDoc(doc(db, 'schools', schoolName, collectionName, postId), { isBlocked: !isBlocked });
      setPosts(prevPosts =>
        prevPosts.map(post =>
          post.id === postId && post.collection === collectionName
            ? { ...post, isBlocked: !isBlocked }
            : post
        )
      );
    } catch (error) {
      console.error("Error blocking/unblocking post:", error);
    }
  };

  const handleDelete = async (postId, collectionName) => {
    if (window.confirm("Are you sure you want to delete this post? This action is irreversible.")) {
      try {
        await deleteDoc(doc(db, 'schools', schoolName, collectionName, postId));
        setPosts(prevPosts => prevPosts.filter(p => !(p.id === postId && p.collection === collectionName)));
      } catch (error) {
        console.error("Error deleting post:", error);
      }
    }
  };

  // --- FILTERING ---
  const filteredPosts = posts.filter(
    post =>
      post.text?.toLowerCase().includes(search.toLowerCase()) ||
      post.authorName?.toLowerCase().includes(search.toLowerCase()) ||
      post.id?.toLowerCase().includes(search.toLowerCase())
  );

  const filteredByTab = filteredPosts.filter(post => {
    if (activeTab === 'all') return true;
    if (activeTab === 'lost') return post.collection === 'LostItems';
    if (activeTab === 'found') return post.collection === 'FoundItems';
    return true;
  });

  const filteredByCategory = filteredByTab.filter(post => {
    if (postCategoryFilter === 'all') return true;
    if (postCategoryFilter === 'claimed') return post.claimed === true;
    if (postCategoryFilter === 'unclaimed') return !post.claimed;
    return true;
  });

  // --- COUNTS ---
  const totalAll = posts.length;
  const totalLost = posts.filter(p => p.collection === 'LostItems').length;
  const totalFound = posts.filter(p => p.collection === 'FoundItems').length;
  const totalClaimed = posts.filter(p => p.claimed === true).length;
  const totalUnclaimed = posts.filter(p => !p.claimed).length;

  // --- STATUS HELPER ---
  function getPostStatus(post) {
    if (post.isBlocked) return 'Blocked';
    if (post.claimed) return 'Claimed';
    return 'Unclaimed';
  }

 

  // --- RENDER CARDS ---
  function renderCards(group) {
    return (
      <div className="admin-posts-cards-grid">
        {group.length === 0 ? (
          <div className="admin-posts-empty-state">No posts found.</div>
        ) : (
          group.map(post => (
            <div key={post.id} className={`post-card ${post.isBlocked ? 'post-card-blocked' : ''}`}>
              <div className="post-card-header">
                <h4 className="post-card-title">{post.collection === 'FoundItems' ? 'Found Item' : 'Lost Item'}</h4>
                <p className="post-card-author">By {post.authorName || 'Unknown'}</p>
              </div>
              <div className="post-card-details">
                <p><strong>Post ID:</strong> {post.id}</p>
                <p><strong>Text:</strong> {post.text || '-'}</p>
                <p><strong>Status:</strong> 
                  <span className={`status-badge status-${getPostStatus(post).toLowerCase()}`}>
                    {getPostStatus(post)}
                  </span>
                </p>
                <p><strong>Posted:</strong> {post.createdAt?.seconds ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'N/A'}</p>
              </div>
              <div className="post-card-actions">
                <button
                  className={post.isBlocked ? 'action-btn action-btn-unblock' : 'action-btn action-btn-block'}
                  onClick={() => handleBlock(post.id, post.isBlocked, post.collection)}
                >
                  {post.isBlocked ? 'Unblock' : 'Block'}
                </button>
                <button
                  className="action-btn action-btn-delete"
                  onClick={() => handleDelete(post.id, post.collection)}
                >
                  Delete
                </button>
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
          <h1>Post Management</h1>
        </header>

        <div className="admin-content-area">
          {/* Sidebar */}
          <div className="admin-sidebar">
            <div className="admin-tabs-nav">
              <button
                className={`tab-button ${activeTab === 'analytics' ? 'active' : ''}`}
                onClick={() => setActiveTab('analytics')}
              >
                Analytics 📊
              </button>
              <button
                className={`tab-button ${activeTab === 'all' ? 'active' : ''}`}
                onClick={() => setActiveTab('all')}
              >
                All Posts ({totalAll})
              </button>
              <button
                className={`tab-button ${activeTab === 'lost' ? 'active' : ''}`}
                onClick={() => setActiveTab('lost')}
              >
                Lost Items ({totalLost})
              </button>
              <button
                className={`tab-button ${activeTab === 'found' ? 'active' : ''}`}
                onClick={() => setActiveTab('found')}
              >
                Found Items ({totalFound})
              </button>
            </div>

            {activeTab !== 'analytics' && (
              <div className="post-filter-section">
                <h4 className="filter-section-title">Filter Posts</h4>
                <div className="filter-buttons-group">
                  <button
                    className={`filter-button ${postCategoryFilter === 'all' ? 'active' : ''}`}
                    onClick={() => setPostCategoryFilter('all')}
                  >
                    All ({totalAll})
                  </button>
                  <button
                    className={`filter-button ${postCategoryFilter === 'claimed' ? 'active' : ''}`}
                    onClick={() => setPostCategoryFilter('claimed')}
                  >
                    Claimed ({totalClaimed})
                  </button>
                  <button
                    className={`filter-button ${postCategoryFilter === 'unclaimed' ? 'active' : ''}`}
                    onClick={() => setPostCategoryFilter('unclaimed')}
                  >
                    Unclaimed ({totalUnclaimed})
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <main className="admin-main-content">
            {activeTab !== 'analytics' && (
              <div className="search-bar-container">
                <input
                  className="search-input"
                  type="text"
                  placeholder="Search by text, author, or ID..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            )}

            {loading ? (
              <div className="loading-state">Loading posts...</div>
            ) : (
              <>
                {activeTab === 'analytics' && (
                  <section className="analytics-section">
                    <AdminPostsAnalytics posts={posts} />
                  </section>
                )}

                {activeTab !== 'analytics' && (
                  <section className="posts-list-section">
                    <h3 className="section-title">Posts</h3>
                    {renderCards(filteredByCategory)}
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

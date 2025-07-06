import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import Navbar from '../components/NavbarAdmin';
import './AdminPosts.css';

export default function AdminPosts() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [mainTab, setMainTab] = useState('all'); // all | lost | found
  const [subTab, setSubTab] = useState('all');    // all | claimed | unclaimed

  useEffect(() => {
    async function fetchPosts() {
      setLoading(true);
      const foundSnapshot = await getDocs(collection(db, 'FoundItems'));
      const lostSnapshot = await getDocs(collection(db, 'LostItems'));

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
      setLoading(false);
    }
    fetchPosts();
  }, []);

  const handleBlock = async (postId, isBlocked, collectionName) => {
    await updateDoc(doc(db, collectionName, postId), { isBlocked: !isBlocked });
    setPosts(posts.map(post => 
      post.id === postId && post.collection === collectionName
        ? { ...post, isBlocked: !isBlocked }
        : post
    ));
  };

  const handleDelete = async (postId, collectionName) => {
    if (window.confirm("Are you sure you want to delete this post? This action is irreversible.")) {
      await deleteDoc(doc(db, collectionName, postId));
      setPosts(posts.filter(post => !(post.id === postId && post.collection === collectionName)));
    }
  };

  // Search filter
  const filteredPosts = posts.filter(
    post =>
      (post.text?.toLowerCase().includes(search.toLowerCase()) ||
      post.authorName?.toLowerCase().includes(search.toLowerCase()) ||
      post.id?.toLowerCase().includes(search.toLowerCase()))
  );

  // Main tab filter
  let displayedPosts = filteredPosts;
  if (mainTab === 'lost') {
    displayedPosts = filteredPosts.filter(post => post.collection === 'LostItems');
  } else if (mainTab === 'found') {
    displayedPosts = filteredPosts.filter(post => post.collection === 'FoundItems');
  }
  // Sub tab filter
  if (subTab === 'claimed') {
    displayedPosts = displayedPosts.filter(post => post.claimed === true);
  } else if (subTab === 'unclaimed') {
    displayedPosts = displayedPosts.filter(post => !post.claimed);
  }

  function renderTable(posts) {
    return (
      <table className="admin-posts-table">
        <thead>
          <tr>
            <th>Post ID</th>
            <th>Type</th>
            <th>Text</th>
            <th>Status</th>
            <th>Author</th>
            <th>Posted</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {posts.map(post => (
            <tr key={post.id} className={post.isBlocked ? 'post-blocked-row' : ''}>
              <td data-label="Post ID">{post.id}</td>
              <td data-label="Type">{post.collection === 'FoundItems' ? 'Found' : 'Lost'}</td>
              <td data-label="Text">{post.text || '-'}</td>
              <td data-label="Status">
                <span className={post.isBlocked ? 'status-blocked' : 'status-active'}>
                  {post.isBlocked
                    ? 'Blocked'
                    : (post.claimed ? 'Claimed' : 'Unclaimed')}
                </span>
              </td>
              <td data-label="Author">{post.authorName || '-'}</td>
              <td data-label="Posted">{post.createdAt?.seconds
                ? new Date(post.createdAt.seconds * 1000).toLocaleDateString()
                : '-'}</td>
              <td data-label="Actions">
                <button
                  className={post.isBlocked ? 'unblock-btn' : 'block-btn'}
                  onClick={() => handleBlock(post.id, post.isBlocked, post.collection)}
                >
                  {post.isBlocked ? 'Unblock' : 'Block'}
                </button>
                <button
                  className="delete-btn"
                  onClick={() => handleDelete(post.id, post.collection)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {posts.length === 0 && (
            <tr>
              <td colSpan={7} style={{ textAlign: 'center', color: '#777' }}>
                No posts found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    );
  }

  // Sub-tab options
  const renderSubTabs = () => (
    <div className="admin-posts-tabs" style={{marginBottom: 0}}>
      <button
        className={subTab === 'all' ? 'tab-btn active' : 'tab-btn'}
        onClick={() => setSubTab('all')}
      >
        All
      </button>
      <button
        className={subTab === 'claimed' ? 'tab-btn active' : 'tab-btn'}
        onClick={() => setSubTab('claimed')}
      >
        Claimed
      </button>
      <button
        className={subTab === 'unclaimed' ? 'tab-btn active' : 'tab-btn'}
        onClick={() => setSubTab('unclaimed')}
      >
        Unclaimed
      </button>
    </div>
  )

  return (
    <div>
      <Navbar />
      <div className="admin-posts-container">
        <h2>Post Management</h2>
        <input
          className="admin-posts-search"
          type="text"
          placeholder="Search by text, author, or ID..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Main Tabs */}
        <div className="admin-posts-tabs">
          <button
            className={mainTab === 'all' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => { setMainTab('all'); setSubTab('all'); }}
          >
            All
          </button>
          <button
            className={mainTab === 'lost' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => { setMainTab('lost'); setSubTab('all'); }}
          >
            Lost Items
          </button>
          <button
            className={mainTab === 'found' ? 'tab-btn active' : 'tab-btn'}
            onClick={() => { setMainTab('found'); setSubTab('all'); }}
          >
            Found Items
          </button>
        </div>

        {/* Sub-tabs for Lost/Found */}
        {(mainTab === 'lost' || mainTab === 'found') && renderSubTabs()}

        {loading ? (
          <div className="admin-posts-loading">Loading posts...</div>
        ) : (
          <>
            <h3 style={{ marginTop: '24px' }}>
              {mainTab === 'all'
                ? 'All Posts'
                : mainTab === 'lost'
                  ? (subTab === 'all'
                    ? 'All Lost Items'
                    : subTab === 'claimed'
                      ? 'Claimed Lost Items'
                      : 'Unclaimed Lost Items')
                  : (subTab === 'all'
                    ? 'All Found Items'
                    : subTab === 'claimed'
                      ? 'Claimed Found Items'
                      : 'Unclaimed Found Items')}
            </h3>
            {renderTable(displayedPosts)}
          </>
        )}
      </div>
    </div>
  );
}
import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import UserFoundItem from './UserFoundItem';
import './UserPostFeed.css';

function UserPostFeed({ schoolName }) {
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!schoolName) {
      setLoading(false);
      return;
    }

    const foundItemsRef = collection(db, 'schools', schoolName, 'FoundItems');
    const foundQuery = query(foundItemsRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(
      foundQuery,
      (snapshot) => {
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFoundItems(items);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching found items:', error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [schoolName]);

  // Filtering logic
  const filteredPosts = foundItems.filter((post) => {
    if (filter === 'claimed') return post.claimed;
    if (filter === 'unclaimed') return !post.claimed;
    return true;
  });

  const FilterBar = () => (
    <div className="ui-filter-bar">
      <span className="ui-filter-label">Filter by status:</span>
      <div className="ui-filter-buttons">
        <button
          onClick={() => setFilter('all')}
          className={filter === 'all' ? 'ui-filter-btn ui-active-filter' : 'ui-filter-btn'}
        >
          All
        </button>
        <button
          onClick={() => setFilter('claimed')}
          className={
            filter === 'claimed'
              ? 'ui-filter-btn ui-active-filter ui-claimed-filter'
              : 'ui-filter-btn'
          }
        >
          Claimed
        </button>
        <button
          onClick={() => setFilter('unclaimed')}
          className={
            filter === 'unclaimed'
              ? 'ui-filter-btn ui-active-filter ui-unclaimed-filter'
              : 'ui-filter-btn'
          }
        >
          Unclaimed
        </button>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="user-post-feed-container">
        <h2 className="admin-post-feed-title">
          Recently Found – Visit the Lost & Found Office to Claim
        </h2>
        <FilterBar />
        <div className="skeleton-loader">
          <div className="skeleton-card"></div>
          <div className="skeleton-card"></div>
        </div>
      </div>
    );
  }

  if (!loading && filteredPosts.length === 0) {
    return (
      <div className="user-post-feed-container">
        <h2 className="admin-post-feed-title">
          Recently Found – Visit the Lost & Found Office to Claim
        </h2>
        <FilterBar />
        <div className="empty-state">
          <img
            src="/no-items.svg"
            alt="No found items"
            className="empty-state-img"
          />
          <p className="no-items-message">
            No {filter} found items have been posted yet.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="user-post-feed-container">
      <h2 className="admin-post-feed-title">
        Recently Found – Visit the Lost & Found Office to Claim
      </h2>
      <FilterBar />
      <div className="user-item-list">
        {filteredPosts.map((item) => (
          <UserFoundItem key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}

export default UserPostFeed;

import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import { db } from '../config/firebase';
import AdminFoundItem from './AdminFoundItem';
import './AdminFoundItemPage.css';

function AdminTimelineFoundItem({ schoolName }) {
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!schoolName || !user) {
      setLoading(false);
      console.warn("School name or user not provided. Cannot fetch found items.");
      return;
    }

    setLoading(true);

    const foundItemsRef = collection(db, 'schools', schoolName, 'FoundItems');

    // ✅ Filter only posts created by the logged-in admin using `authorId`
    const foundQuery = query(
      foundItemsRef,
      where('authorId', '==', user.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(
      foundQuery,
      (snapshot) => {
        const items = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        setFoundItems(items);
        setLoading(false);
      },
      (error) => {
        console.error("Error fetching found items:", error);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [schoolName]);

  const itemCategories = [
    "Cellphone", "Tablet", "Laptop", "Bag/Backpack", "Keys", "Watch", "Wallet/Purse",
    "ID Card/Student Card", "Umbrella", "Book/Notebook", "Calculator", "Earphones/Headphones",
    "Charger/Powerbank", "Clothing (Jacket, Hoodie, etc.)", "Shoes/Slippers", "Eyeglasses",
    "Water Bottle", "Sports Equipment", "USB/Flash Drive", "Other"
  ];

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
      <div className="ui-category-filter">
        <label htmlFor="category-filter" className="ui-category-filter-label">
          Item Category:
        </label>
        <select
          id="category-filter"
          className="ui-category-filter-select"
          value={categoryFilter}
          onChange={e => setCategoryFilter(e.target.value)}
        >
          <option value="all">All</option>
          {itemCategories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>
      </div>
    </div>
  );

  const filteredItems = foundItems.filter(item => {
    const statusMatch =
      filter === 'all' ||
      (filter === 'claimed' && item.claimed === true) ||
      (filter === 'unclaimed' && item.claimed !== true);

    const categoryMatch =
      categoryFilter === 'all' ||
      (item.category && item.category === categoryFilter);

    return statusMatch && categoryMatch;
  });

  return (
    <div className="admin-post-feed-container">
      <FilterBar />
      {loading ? (
        <p className="loading-message">Loading your found items...</p>
      ) : filteredItems.length > 0 ? (
        <div className="admin-items-list">
          {filteredItems.map(item => (
            <AdminFoundItem key={item.id} item={item} type="found" />
          ))}
        </div>
      ) : (
        <p className="no-items-message">You haven't posted any found items yet.</p>
      )}
    </div>
  );
}

export default AdminTimelineFoundItem;

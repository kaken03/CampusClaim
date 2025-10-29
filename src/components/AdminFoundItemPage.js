import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import AdminFoundItem from './AdminFoundItem'; // Assuming you have this component
import './AdminFoundItemPage.css'; // Styling for this component

/**
 * A component for the admin dashboard to display all "Found Item" posts
 * for the specified school in real-time.
 * * @param {object} props - The component props.
 * @param {string} props.schoolName - The name of the school to fetch posts for.
 */
function AdminPostFeed({ schoolName }) {
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    // Stop fetching if no schoolName is provided
    if (!schoolName) {
      setLoading(false);
      console.warn("School name not provided to AdminPostFeed. Cannot fetch found items.");
      return;
    }

    setLoading(true);

    const foundItemsRef = collection(db, 'schools', schoolName, 'FoundItems');
    // Create a query to get all found items, ordered by creation time
    const foundQuery = query(foundItemsRef, orderBy('createdAt', 'desc'));

    // Set up a real-time listener for found items
    const unsubscribe = onSnapshot(foundQuery, (snapshot) => {
      // Map through the documents and create an array of item objects
      const items = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setFoundItems(items);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching found items:", error);
      setLoading(false);
    });

    // Clean up the listener when the component unmounts
    return () => unsubscribe();
  }, [schoolName]);

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

  const itemCategories = [
  "Cellphone",
  "Tablet",
  "Laptop",
  "Bag/Backpack",
  "Keys",
  "Watch",
  "Wallet/Purse",
  "ID Card/Student Card",
  "Umbrella",
  "Book/Notebook",
  "Calculator",
  "Earphones/Headphones",
  "Charger/Powerbank",
  "Clothing (Jacket, Hoodie, etc.)",
  "Shoes/Slippers",
  "Eyeglasses",
  "Water Bottle",
  "Sports Equipment",
  "USB/Flash Drive",
  "Other"
];



  return (
    <div className="admin-post-feed-container">
      <FilterBar />
      {loading ? (
        <p className="loading-message">Loading found items...</p>
      ) : filteredItems.length > 0 ? (
        <div className="admin-items-list">
          {/* Map through the found items and render a component for each one */}
          {filteredItems.map(item => (
            <AdminFoundItem 
              key={item.id} 
              item={item} 
              type="found"
            />
          ))}
        </div>
      ) : (
        <p className="no-items-message">No found items have been posted yet.</p>
      )}
    </div>
  );
}

export default AdminPostFeed;

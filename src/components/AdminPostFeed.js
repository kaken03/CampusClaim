import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import AdminFoundItem from './AdminFoundItem'; // Assuming you have this component
import './AdminPostFeed.css'; // Styling for this component

/**
 * A component for the admin dashboard to display all "Found Item" posts
 * for the specified school in real-time.
 * * @param {object} props - The component props.
 * @param {string} props.schoolName - The name of the school to fetch posts for.
 */
function AdminPostFeed({ schoolName }) {
  const [foundItems, setFoundItems] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="admin-post-feed-container">
      <h2 className="admin-post-feed-title">Found Items</h2>
      {loading ? (
        <p className="loading-message">Loading found items...</p>
      ) : foundItems.length > 0 ? (
        <div className="admin-items-list">
          {/* Map through the found items and render a component for each one */}
          {foundItems.map(item => (
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

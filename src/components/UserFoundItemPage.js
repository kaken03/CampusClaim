// import React, { useState, useEffect, useRef } from 'react';
// import {
//   collection,
//   query,
//   onSnapshot,
//   orderBy,
//   where,
//   doc,
//   getDoc,
// } from 'firebase/firestore';
// import { getAuth, onAuthStateChanged } from 'firebase/auth';
// import { db } from '../firebase';
// import UserFoundItem from './UserFoundItem';
// import './UserFoundItemPage.css';

// const itemCategories = [
//   'Cellphone',
//   'Tablet',
//   'Laptop',
//   'Bag/Backpack',
//   'Keys',
//   'Watch',
//   'Wallet/Purse',
//   'ID Card/Student Card',
//   'Umbrella',
//   'Book/Notebook',
//   'Calculator',
//   'Earphones/Headphones',
//   'Charger/Powerbank',
//   'Clothing (Jacket, etc.)',
//   'Shoes/Slippers',
//   'Eyeglasses',
//   'Water Bottle',
//   'Sports Equipment',
//   'USB/Flash Drive',
//   'Other',
// ];

// function UserPostFeed({ schoolName }) {
//   const [foundItems, setFoundItems] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [filter, setFilter] = useState('all');
//   const [categoryFilter, setCategoryFilter] = useState('all');

//   const auth = getAuth();
//   const [user, setUser] = useState(null);
//   const [role, setRole] = useState('');

//   // Refs to hold partial realtime results for deterministic merging
//   const nonBlockedRef = useRef(new Map());
//   const myPostsRef = useRef(new Map());
//   const unsubNotBlockedRef = useRef(null);
//   const unsubMyPostsRef = useRef(null);
//   const authUnsubRef = useRef(null);
//   const mountedRef = useRef(true);

//   useEffect(() => {
//     mountedRef.current = true;
//     return () => {
//       mountedRef.current = false;
//     };
//   }, []);

//   // reactive auth state + fetch role (if any)
//   useEffect(() => {
//     authUnsubRef.current = onAuthStateChanged(auth, async (current) => {
//       setUser(current || null);
//       setRole('');
//       if (current && schoolName) {
//         try {
//           const userDocRef = doc(db, 'schools', schoolName, 'users', current.uid);
//           const snap = await getDoc(userDocRef);
//           if (snap.exists()) {
//             setRole(snap.data()?.role || '');
//           } else {
//             setRole('');
//           }
//         } catch (err) {
//           console.error('Failed to fetch user role for found items feed:', err);
//           setRole('');
//         }
//       } else {
//         setRole('');
//       }
//     });
//     return () => {
//       if (authUnsubRef.current) authUnsubRef.current();
//     };
//   }, [auth, schoolName]);

//   // merge partial results and set into state
//   const mergeAndSet = () => {
//     const map = new Map();
//     nonBlockedRef.current.forEach((val, key) => map.set(key, val));
//     myPostsRef.current.forEach((val, key) => map.set(key, val));
//     const arr = Array.from(map.values()).sort((a, b) => {
//       const aTime = a.createdAt?.seconds ? a.createdAt.seconds * 1000 : (a.createdAt ? new Date(a.createdAt).getTime() : 0);
//       const bTime = b.createdAt?.seconds ? b.createdAt.seconds * 1000 : (b.createdAt ? new Date(b.createdAt).getTime() : 0);
//       return bTime - aTime;
//     });
//     if (mountedRef.current) {
//       setFoundItems(arr);
//       setLoading(false);
//     }
//   };

//   // subscribe to realtime queries:
//   // - everyone: posts where isBlocked == false
//   // - logged-in author: their own posts (so authors still see blocked)
//   // - admin: subscribe to ALL posts
//   useEffect(() => {
//     if (!schoolName) {
//       setLoading(false);
//       return;
//     }

//     // cleanup previous subscriptions
//     if (unsubNotBlockedRef.current) {
//       unsubNotBlockedRef.current();
//       unsubNotBlockedRef.current = null;
//     }
//     if (unsubMyPostsRef.current) {
//       unsubMyPostsRef.current();
//       unsubMyPostsRef.current = null;
//     }
//     nonBlockedRef.current.clear();
//     myPostsRef.current.clear();
//     setFoundItems([]);
//     setLoading(true);

//     const foundItemsRef = collection(db, 'schools', schoolName, 'FoundItems');

//     // 1) subscribe to not-blocked posts for everyone
//     // ensure posts have explicit isBlocked:false (migration recommended for older docs)
//     const notBlockedQuery = query(foundItemsRef, where('isBlocked', '==', false), orderBy('createdAt', 'desc'));
//     unsubNotBlockedRef.current = onSnapshot(
//       notBlockedQuery,
//       (snapshot) => {
//         nonBlockedRef.current.clear();
//         snapshot.docs.forEach((d) => {
//           nonBlockedRef.current.set(d.id, { id: d.id, ...d.data() });
//         });
//         mergeAndSet();
//       },
//       (err) => {
//         console.error('Error fetching non-blocked found items:', err);
//         if (mountedRef.current) setLoading(false);
//       }
//     );

//     // 2) if user is present, decide admin vs non-admin behavior
//     if (user) {
//       const isAdmin = role === 'admin' || role === 'main-admin' || role === 'super-admin' || user.email?.endsWith('@admin.com');

//       if (isAdmin) {
//         // admin: unsubscribe not-blocked and subscribe to all posts (they should see everything)
//         if (unsubNotBlockedRef.current) {
//           unsubNotBlockedRef.current();
//           unsubNotBlockedRef.current = null;
//         }
//         const allQuery = query(foundItemsRef, orderBy('createdAt', 'desc'));
//         unsubNotBlockedRef.current = onSnapshot(
//           allQuery,
//           (snapshot) => {
//             nonBlockedRef.current.clear();
//             snapshot.docs.forEach((d) => nonBlockedRef.current.set(d.id, { id: d.id, ...d.data() }));
//             myPostsRef.current.clear();
//             mergeAndSet();
//           },
//           (err) => {
//             console.error('Error fetching all found items for admin:', err);
//             if (mountedRef.current) setLoading(false);
//           }
//         );
//       } else {
//         // non-admin: subscribe to the user's own posts (author should see their blocked posts)
//         const myQuery = query(foundItemsRef, where('authorId', '==', user.uid), orderBy('createdAt', 'desc'));
//         unsubMyPostsRef.current = onSnapshot(
//           myQuery,
//           (snapshot) => {
//             myPostsRef.current.clear();
//             snapshot.docs.forEach((d) => myPostsRef.current.set(d.id, { id: d.id, ...d.data() }));
//             mergeAndSet();
//           },
//           (err) => {
//             console.error('Error fetching my found items:', err);
//           }
//         );
//       }
//     } else {
//       // guest: myPosts remains empty (non-blocked covers everything they should see)
//       myPostsRef.current.clear();
//       mergeAndSet();
//     }

//     return () => {
//       if (unsubNotBlockedRef.current) unsubNotBlockedRef.current();
//       if (unsubMyPostsRef.current) unsubMyPostsRef.current();
//       unsubNotBlockedRef.current = null;
//       unsubMyPostsRef.current = null;
//     };
//   }, [schoolName, user, role]);

//   // Filtering logic
//   const filteredItems = foundItems.filter(item => {
//     const statusMatch =
//       filter === 'all' ||
//       (filter === 'claimed' && item.claimed === true) ||
//       (filter === 'unclaimed' && item.claimed !== true);

//     const categoryMatch =
//       categoryFilter === 'all' ||
//       (item.category && item.category === categoryFilter);

//     return statusMatch && categoryMatch;
//   });

//   const FilterBar = () => (
//     <div className="ui-filter-bar">
//       <span className="ui-filter-label">Filter by status:</span>
//       <div className="ui-filter-buttons">
//         <button
//           onClick={() => setFilter('all')}
//           className={filter === 'all' ? 'ui-filter-btn ui-active-filter' : 'ui-filter-btn'}
//         >
//           All
//         </button>
//         <button
//           onClick={() => setFilter('claimed')}
//           className={
//             filter === 'claimed'
//               ? 'ui-filter-btn ui-active-filter ui-claimed-filter'
//               : 'ui-filter-btn'
//           }
//         >
//           Claimed
//         </button>
//         <button
//           onClick={() => setFilter('unclaimed')}
//           className={
//             filter === 'unclaimed'
//               ? 'ui-filter-btn ui-active-filter ui-unclaimed-filter'
//               : 'ui-filter-btn'
//           }
//         >
//           Unclaimed
//         </button>
//       </div>
//       <div className="ui-category-filter">
//         <label htmlFor="category-filter" className="ui-category-filter-label">
//           Item Category:
//         </label>
//         <select
//           id="category-filter"
//           className="ui-category-filter-select"
//           value={categoryFilter}
//           onChange={e => setCategoryFilter(e.target.value)}
//         >
//           <option value="all">All</option>
//           {itemCategories.map(cat => (
//             <option key={cat} value={cat}>{cat}</option>
//           ))}
//         </select>
//       </div>
//     </div>
//   );

//   if (loading) {
//     return (
//       <div className="user-post-feed-container">
//         {/* <h2 className="admin-post-feed-title">
//           Recently Found – Visit the Lost & Found Office to Claim
//         </h2> */}
//         <FilterBar />
//         <div className="skeleton-loader">
//           <div className="skeleton-card"></div>
//           <div className="skeleton-card"></div>
//         </div>
//       </div>
//     );
//   }

//   if (!loading && filteredItems.length === 0) {
//     return (
//       <div className="user-post-feed-container">
//         {/* <h2 className="admin-post-feed-title">
//           Recently Found – Visit the Lost & Found Office to Claim
//         </h2> */}
//         <FilterBar />
//         <div className="empty-state">
//           <p className="no-items-message">
//             No found items have been posted yet.
//           </p>
//         </div>
//       </div>
//     );
//   }

//   return (
//     <div className="user-post-feed-container">
//       {/* <h2 className="ui-admin-post-feed-title">
//         Recently Found – Visit the Lost & Found Office to Claim
//       </h2> */}
//       <FilterBar />
//       <div className="user-item-list">
//         {filteredItems.map((item) => (
//           <UserFoundItem key={item.id} item={item} />
//         ))}
//       </div>
//     </div>
//   );
// }

// export default UserPostFeed;
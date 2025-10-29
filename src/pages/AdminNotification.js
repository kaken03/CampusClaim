// import React, { useEffect, useState } from "react";
// import { db } from "../firebase";
// import {
//   collection,
//   doc,
//   getDoc,
//   getDocs,
//   onSnapshot,
//   orderBy,
//   query,
//   where,
// } from "firebase/firestore";
// import { getAuth } from "firebase/auth";
// import { useNavigate } from "react-router-dom";
// import "./Notification.css";
// import AdminNavbar from "../components/AdminNavbar";
// import { FaCommentDots } from "react-icons/fa";
// import { IoMdCheckmarkCircleOutline } from "react-icons/io";

// export default function PostNotification() {
//   const [commentNotifs, setCommentNotifs] = useState([]); // notifications from comments (per post)
//   const [userNotifs, setUserNotifs] = useState([]); // notifications from users/{uid}/notifications
//   const [loading, setLoading] = useState(true);
//   const auth = getAuth();
//   const navigate = useNavigate();

//   useEffect(() => {
//     let unsubscribePosts = null;
//     let unsubscribeUserNotifs = null;
//     let unsubscribed = false;

//     const fetchUserAndListen = async (user) => {
//       if (!user) return;
//       let schoolName = localStorage.getItem("schoolName");

//       // try to find school if not stored
//       if (!schoolName) {
//         const schoolList = ["Consolatrix College of Toledo City"];
//         for (const school of schoolList) {
//           const userDoc = await getDoc(doc(db, "schools", school, "users", user.uid));
//           if (userDoc.exists()) {
//             schoolName = school;
//             localStorage.setItem("schoolName", schoolName);
//             break;
//           }
//         }
//       }

//       if (!schoolName) {
//         setLoading(false);
//         return;
//       }

//       // Listen for comment notifications (LostItems -> comments)
//       const postsRef = collection(db, "schools", schoolName, "LostItems");
//       const postsQuery = query(postsRef, where("authorId", "==", user.uid));
//       unsubscribePosts = onSnapshot(postsQuery, async (snapshot) => {
//         const newCommentNotifs = [];
//         const promises = snapshot.docs.map(async (docSnap) => {
//           const post = docSnap.data();
//           const postId = docSnap.id;
//           const commentsRef = collection(db, "schools", schoolName, "LostItems", postId, "comments");
//           const commentsQuery = query(commentsRef, orderBy("timestamp", "asc"));
//           const commentsSnap = await getDocs(commentsQuery);
//           const otherComments = commentsSnap.docs
//             .map((c) => c.data())
//             .filter((c) => c.authorId !== user.uid);

//           if (otherComments.length > 0) {
//             const latestComment = otherComments[otherComments.length - 1];
//             newCommentNotifs.push({
//               id: postId,
//               type: "comment",
//               postId,
//               postText: post.text || "(no text)",
//               latestCommentText: latestComment.text,
//               latestCommentAuthor: latestComment.author || "Someone",
//               commentCount: otherComments.length,
//               timestamp: latestComment.timestamp,
//               schoolName,
//             });
//           }
//         });

//         await Promise.all(promises);

//         if (!unsubscribed) {
//           setCommentNotifs(newCommentNotifs);
//           setLoading(false);
//         }
//       });

//       // Listen for user notifications (users/{uid}/notifications)
//       const notifRef = collection(db, "schools", schoolName, "users", user.uid, "notifications");
//       const notifQuery = query(notifRef, orderBy("timestamp", "desc"));
//       unsubscribeUserNotifs = onSnapshot(notifQuery, (snapshot) => {
//         const verifs = snapshot.docs.map((d) => ({
//           id: d.id,
//           type: d.data().type || "notification",
//           message: d.data().message || "",
//           read: d.data().read || false,
//           timestamp: d.data().timestamp,
//           docRef: d.ref, // optional: handy if needed
//         }));
//         if (!unsubscribed) {
//           setUserNotifs(verifs);
//           setLoading(false);
//         }
//       });
//     };

//     const unsubscribeAuth = auth.onAuthStateChanged((user) => {
//       if (user) fetchUserAndListen(user);
//       else setLoading(false);
//     });

//     return () => {
//       unsubscribed = true;
//       unsubscribeAuth();
//       if (unsubscribePosts) unsubscribePosts();
//       if (unsubscribeUserNotifs) unsubscribeUserNotifs();
//     };
//   }, [auth]);

//   // Merge comments + user notifications, sort by timestamp desc
//   const notifications = React.useMemo(() => {
//     const combined = [...commentNotifs, ...userNotifs];

//     // normalize timestamps for sorting
//     const getTimeInMs = (t) => {
//       if (!t) return 0;
//       if (t.toDate) return t.toDate().getTime();
//       if (t.seconds) return t.seconds * 1000;
//       const maybe = new Date(t).getTime();
//       return isNaN(maybe) ? 0 : maybe;
//     };

//     combined.sort((a, b) => getTimeInMs(b.timestamp) - getTimeInMs(a.timestamp));
//     return combined;
//   }, [commentNotifs, userNotifs]);

//   const timeAgo = (timestamp) => {
//     if (!timestamp) return "just now";
//     const now = new Date();
//     const time =
//       timestamp.toDate?.() ||
//       new Date(timestamp.seconds ? timestamp.seconds * 1000 : timestamp);
//     const diff = Math.floor((now - time) / 1000);
//     if (diff < 60) return `${diff}s ago`;
//     if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
//     if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
//     return `${Math.floor(diff / 86400)}d ago`;
//   };


//   // click handler for list items
//   const handleClick = async (n) => {
//     if (n.type === "comment") {
//       navigate(`/timeline?postId=${n.postId}&school=${encodeURIComponent(n.schoolName)}`);
//     }  
//   };

//   return (
//     <div className="notification-page-bg">
//       <AdminNavbar />
//       <div className="notification-main-card">
//         {loading ? (
//           <p className="loading">Loading notifications...</p>
//         ) : notifications.length === 0 ? (
//           <p className="no-notifications">No new notifications</p>
//         ) : (
//           <ul className="notification-list">
//             {notifications.map((n) => {
//               // unique key: include type so postId and notification doc id won't clash
//               const key = `${n.type || "notif"}_${n.id}`;
//               return (
//                 <li
//                   key={key}
//                   className="notification-card"
//                   onClick={() => handleClick(n)}
//                 >
//                   <div className="notification-icon">
//                     {n.type === "verification" ? (
//                       <IoMdCheckmarkCircleOutline size={28} />
//                     ) : (
//                       <FaCommentDots size={28} />
//                     )}
//                   </div>

//                   <div className="notification-content">
//                     {n.type === "comment" ? (
//                       <>
//                         <span className="notification-author">{n.latestCommentAuthor}</span>
//                         <span className="notification-text">
//                           {" "}
//                           commented on your post{" "}
//                           <span className="notification-post">
//                             "{(n.postText || "").substring(0, 30)}..."
//                           </span>
//                           {n.commentCount > 1 && (
//                             <span className="more-comments"> (+{n.commentCount - 1} more)</span>
//                           )}
//                         </span>
//                       </>
//                     ) : (
//                       <>
//                         <span className="notification-text">{n.message}</span>
//                       </>
//                     )}
//                     <span className="notification-timestamp">{timeAgo(n.timestamp)}</span>
//                   </div>
//                 </li>
//               );
//             })}
//           </ul>
//         )}
//       </div>
//     </div>
//   );
// }

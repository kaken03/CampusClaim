import React, { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  getDoc,
  doc
} from 'firebase/firestore';
import { db } from '../firebase';
import { getAuth } from 'firebase/auth';

function CommentSection({ postId }) {
  const [comments, setComments] = useState([]);
  const [commentText, setCommentText] = useState('');
  const auth = getAuth();

  useEffect(() => {
    const q = query(
      collection(db, 'posts', postId, 'comments'),
      orderBy('createdAt', 'asc')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
      setComments(data);
    });

    return () => unsubscribe();
  }, [postId]);

  const handleComment = async () => {
    const user = auth.currentUser;
    if (!commentText.trim()) return;

    // Add the comment
    await addDoc(collection(db, 'posts', postId, 'comments'), {
      text: commentText,
      authorName: user.displayName || 'Anonymous',
      authorId: user.uid,
      createdAt: serverTimestamp()
    });

    // Fetch the post to get authorId and postText
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (postSnap.exists()) {
      const postData = postSnap.data();

      // Only send notification if commenter is NOT the post author
      if (postData.authorId !== user.uid) {
        await addDoc(collection(db, 'notifications'), {
          userId: postData.authorId, // Who should receive the notification
          postId: postId,
          postText: postData.text || '', // Assuming your post has a "text" field
          latestCommentText: commentText,
          latestCommentAuthor: user.displayName || 'Anonymous',
          collectionName: postData.collectionName || '', // If you have this field
          commentCount: comments.length + 1, // The new total comment count
          timestamp: serverTimestamp(),
          read: false
        });
      }
    }

    setCommentText('');
  };

  return (
    <div style={{ marginTop: '10px' }}>
      {comments.map((c) => (
        <div key={c.id} style={{ marginBottom: '5px' }}>
          <strong>{c.authorName}:</strong> {c.text}
        </div>
      ))}

      <div>
        <input
          type="text"
          value={commentText}
          onChange={(e) => setCommentText(e.target.value)}
          placeholder="Write a comment..."
          style={{ width: '80%', marginRight: '5px' }}
        />
        <button onClick={handleComment}>Post</button>
      </div>
    </div>
  );
}

export default CommentSection;
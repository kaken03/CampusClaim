import React, { useEffect, useState } from 'react';
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp
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

    await addDoc(collection(db, 'posts', postId, 'comments'), {
      text: commentText,
      authorName: user.displayName || 'Anonymous',
      authorId: user.uid,
      createdAt: serverTimestamp()
    });

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

import React, { useEffect, useState } from 'react';
import { db } from '../firebase'; // your firebase config file
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

function PostFeed() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setPosts(postsData);
    });

    return () => unsubscribe(); // Clean up listener
  }, []);

  return (
    <div style={styles.feed}>
      {posts.map(post => (
  <div key={post.id} style={styles.postCard}>
    <p style={styles.author}><strong>{post.authorName}</strong> posted:</p>
    {post.imageUrl && <img src={post.imageUrl} alt="Post" style={styles.image} />}
    <p style={styles.text}>{post.text}</p>
    <p style={styles.date}>{post.createdAt?.toDate().toLocaleString()}</p>
  </div>
))}

    </div>
  );
}

const styles = {
  feed: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px'
  },
  author: {
    fontSize: '0.9rem',
    color: '#333',
    marginBottom: '5px'
  },  
  postCard: {
    background: '#fff',
    borderRadius: '8px',
    padding: '15px',
    marginBottom: '15px',
    boxShadow: '0 2px 5px rgba(0,0,0,0.1)'
  },
  image: {
    width: '100%',
    borderRadius: '8px'
  },
  text: {
    fontSize: '1rem',
    margin: '10px 0'
  },
  date: {
    fontSize: '0.8rem',
    color: '#888'
  }
};

export default PostFeed;

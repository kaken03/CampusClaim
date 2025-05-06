// filepath: c:\Users\KAKEN\CampusClaim\src\pages\PostDetails.js
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

function PostDetails() {
  const { postId } = useParams(); // Get the postId from the URL
  const [post, setPost] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      const postRef = doc(db, 'posts', postId);
      const postSnap = await getDoc(postRef);
      if (postSnap.exists()) {
        setPost(postSnap.data());
      } else {
        console.error('Post not found');
      }
    };

    fetchPost();
  }, [postId]);

  if (!post) return <p>Loading post...</p>;

  return (
    <div style={styles.container}>
      <h1>{post.text}</h1>
      {post.imageUrl && <img src={post.imageUrl} alt="Post" style={styles.image} />}
      <h3>Comments:</h3>
      <ul>
        {post.comments?.map((comment, index) => (
          <li key={index}>{comment}</li>
        ))}
      </ul>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    backgroundColor: '#fff',
    borderRadius: '10px',
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
  },
  image: {
    width: '100%',
    borderRadius: '10px',
    marginBottom: '20px',
  },
};

export default PostDetails;
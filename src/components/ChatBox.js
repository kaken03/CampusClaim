import React, { useEffect, useState, useRef } from 'react';
import { db } from '../firebase';
import { collection, addDoc, query, orderBy, onSnapshot, serverTimestamp, doc, updateDoc, getDocs, where, getDoc } from 'firebase/firestore';

function ChatBox({ chatId, currentUserId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [otherUserName, setOtherUserName] = useState('');
  const messagesEndRef = useRef(null);

  // Fetch the other user's name
  useEffect(() => {
    const fetchOtherUserName = async () => {
      const chatDoc = await getDoc(doc(db, 'chats', chatId));
      if (chatDoc.exists()) {
        const participants = chatDoc.data().participants;
        const otherUserId = participants.find(uid => uid !== currentUserId);
        if (otherUserId) {
          const userDoc = await getDoc(doc(db, 'users', otherUserId));
          if (userDoc.exists()) {
            setOtherUserName(userDoc.data().fullName || 'Unknown User');
          } else {
            setOtherUserName('Unknown User');
          }
        }
      }
    };
    if (chatId && currentUserId) {
      fetchOtherUserName();
    }
  }, [chatId, currentUserId]);

  useEffect(() => {
    const q = query(
      collection(db, 'chats', chatId, 'messages'),
      orderBy('timestamp')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [chatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    await addDoc(collection(db, 'chats', chatId, 'messages'), {
      senderId: currentUserId,
      text,
      timestamp: serverTimestamp(),
    });
    await updateDoc(doc(db, 'chats', chatId), {
      lastMessage: text,
      lastUpdated: serverTimestamp(),
    });
    setText('');
  };

  useEffect(() => {
    const markMessagesAsRead = async () => {
      const messagesRef = collection(db, 'chats', chatId, 'messages');
      const q = query(messagesRef, where('readBy', 'not-in', [currentUserId]));
      const snapshot = await getDocs(q);
      snapshot.forEach(async (msgDoc) => {
        const data = msgDoc.data();
        if (!data.readBy?.includes(currentUserId)) {
          await updateDoc(msgDoc.ref, {
            readBy: [...(data.readBy || []), currentUserId],
          });
        }
      });
    };
    if (chatId && currentUserId) {
      markMessagesAsRead();
    }
  }, [chatId, currentUserId]);

  return (
    <div style={{ background: '#fff', border: '1px solid #ddd', borderRadius: 8, padding: 16, width: 350, height: 400, display: 'flex', flexDirection: 'column' }}>
      {/* Display the other user's name at the top */}
      <div style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 8, textAlign: 'center' }}>
        {otherUserName}
      </div>
      <div style={{ flex: 1, overflowY: 'auto', marginBottom: 8 }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ textAlign: msg.senderId === currentUserId ? 'right' : 'left', margin: '4px 0' }}>
            <span style={{ background: msg.senderId === currentUserId ? '#007BFF' : '#eee', color: msg.senderId === currentUserId ? '#fff' : '#333', borderRadius: 12, padding: '6px 12px', display: 'inline-block' }}>
              {msg.text}
            </span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div style={{ display: 'flex' }}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          style={{ flex: 1, borderRadius: 4, border: '1px solid #ccc', padding: 8 }}
          placeholder="Type a message..."
        />
        <button onClick={sendMessage} style={{ marginLeft: 8, padding: '8px 16px', background: '#007BFF', color: '#fff', border: 'none', borderRadius: 4 }}>
          Send
        </button>
        <button onClick={onClose} style={{ marginLeft: 8, padding: '8px 16px', background: '#888', color: '#fff', border: 'none', borderRadius: 4 }}>
          Close
        </button>
      </div>
    </div>
  );
}

export default ChatBox;
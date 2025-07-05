import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, getDoc, doc, getDocs, limit } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';
import ChatBox from './ChatBox';

function MessengerBox({ onClose, onUnreadCountChange }) {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [userNames, setUserNames] = useState({});
  const auth = getAuth();
  const user = auth.currentUser;

  // Fetch chats
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('lastUpdated', 'desc')
    );
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const chatList = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

      // Gather all other UIDs
      const otherUids = Array.from(new Set(
        chatList
          .map(chat => chat.participants.find(uid => uid !== user.uid))
          .filter(Boolean)
      ));

      // Fetch all user names in parallel
      const names = {};
      await Promise.all(otherUids.map(async (uid) => {
        if (!userNames[uid]) {
          const userDoc = await getDoc(doc(db, 'users', uid));
          names[uid] = userDoc.exists() ? userDoc.data().fullName || 'Unknown User' : 'Unknown User';
        }
      }));

      setUserNames(prev => ({ ...prev, ...names }));

      // Only include chats that have at least one message
      const chatListWithMessages = [];
      for (const docSnap of snapshot.docs) {
        const chatId = docSnap.id;
        const messagesRef = collection(db, 'chats', chatId, 'messages');
        const messagesSnap = await getDocs(query(messagesRef, limit(1)));
        if (!messagesSnap.empty) {
          chatListWithMessages.push({ id: chatId, ...docSnap.data() });
        }
      }
      setChats(chatListWithMessages);

      const unsubMessages = [];
      let unreadChats = new Set();

      // ...rest of your unread logic...
      for (const chat of chatList) {
        const otherUid = chat.participants.find(uid => uid !== user.uid);
        // Count if there is at least one unread message from the other user
        const messagesRef = collection(db, 'chats', chat.id, 'messages');
        const messagesQ = query(
          messagesRef,
          where('readBy', 'not-in', [user.uid]),
          where('senderId', '==', otherUid)
        );
        unsubMessages.push(
          onSnapshot(messagesQ, (msgSnap) => {
            if (msgSnap.size > 0) {
              unreadChats.add(chat.id);
            } else {
              unreadChats.delete(chat.id);
            }
            if (onUnreadCountChange) onUnreadCountChange(unreadChats.size);
          })
        );
      }

      // Cleanup
      return () => unsubMessages.forEach(unsub => unsub && unsub());
    });
    return () => unsubscribe();
  }, [user, userNames, onUnreadCountChange]);

  return (
    <div style={{
      position: 'fixed',
      left: 24,
      top: 140,
      width: 360,
      height: 500,
      background: '#fff',
      border: '3px solid #ddd',
      borderRadius: 12,
      boxShadow: '0 2px 20px rgba(0,0,0,0.15)',
      zIndex: 2100,
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ padding: 12, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontWeight: 'bold', fontSize: 18 }}>Messenger</span>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: 20, cursor: 'pointer' }}>×</button>
      </div>
      {!activeChatId ? (
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {chats.length === 0 ? (
            <div style={{ padding: 24, color: '#888', textAlign: 'center' }}>No conversations yet.</div>
          ) : Object.keys(userNames).length < chats.length ? (
            <div style={{ padding: 24, color: '#888', textAlign: 'center' }}>Loading...</div>
          ) : (
            chats.map(chat => {
              const otherUid = chat.participants.find(uid => uid !== user.uid);
              const displayName = userNames[otherUid] || otherUid || 'Unknown User';
              return (
                <div
                  key={chat.id}
                  onClick={() => setActiveChatId(chat.id)}
                  style={{
                    padding: 14,
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    background: '#f9f9f9',
                    marginBottom: 2,
                    fontWeight: 'bold',
                    color: '#007BFF'
                  }}
                >
                  {displayName}
                  <div style={{ fontWeight: 'normal', color: '#555', fontSize: 13, marginTop: 2 }}>
                    {chat.lastMessage || <span style={{ color: '#aaa' }}>No messages yet</span>}
                  </div>
                </div>
              );
            })
          )}
        </div>
      ) : (
        <ChatBox
          chatId={activeChatId}
          currentUserId={user.uid}
          onClose={() => setActiveChatId(null)}
        />
      )}
    </div>
  );
}

export default MessengerBox;
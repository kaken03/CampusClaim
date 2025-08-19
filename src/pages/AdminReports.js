import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, query, orderBy, onSnapshot, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import Navbar from '../components/AdminNavbar';

function AdminInbox() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [replies, setReplies] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'contact_messages'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, snapshot => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load replies for selected message
  useEffect(() => {
    if (!selectedMessage) return setReplies([]);
    const q = collection(db, 'contact_messages', selectedMessage.id, 'replies');
    const unsub = onSnapshot(q, snap => {
      setReplies(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsub();
  }, [selectedMessage]);

  const markAsRead = async (id) => {
    await updateDoc(doc(db, 'contact_messages', id), { status: 'read' });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this message?')) {
      await deleteDoc(doc(db, 'contact_messages', id));
      setSelectedMessage(null);
    }
  };

  return (
    <div>
      <Navbar />
      <div style={{ maxWidth: 800, margin: '40px auto', padding: 24, background: '#f9f9f9', borderRadius: 12 }}>
        <h2>Admin Inbox</h2>
        {loading ? (
          <div>Loading messages...</div>
        ) : messages.length === 0 ? (
          <div>No messages received.</div>
        ) : (
          <div style={{ display: 'flex', gap: 32 }}>
            {/* Message List */}
            <div style={{ flex: 1, borderRight: '1px solid #ddd', paddingRight: 24 }}>
              <h3>Messages</h3>
              <ul style={{ listStyle: 'none', padding: 0, maxHeight: 500, overflowY: 'auto' }}>
                {messages.map(msg => (
                  <li
                    key={msg.id}
                    style={{
                      background: selectedMessage && selectedMessage.id === msg.id
                        ? '#e3f6fc'
                        : msg.status === 'unread'
                          ? '#f5f0ff'
                          : '#fff',
                      marginBottom: 12,
                      padding: 12,
                      borderRadius: 8,
                      border: '1px solid #dee2e6',
                      cursor: 'pointer',
                      fontWeight: msg.status === 'unread' ? 600 : 400
                    }}
                    onClick={() => {
                      setSelectedMessage(msg);
                      if (msg.status !== 'read') markAsRead(msg.id);
                    }}
                  >
                    <div><strong>{msg.name}</strong> &lt;{msg.email}&gt;</div>
                    <div style={{ fontSize: 13, color: '#888' }}>
                      {msg.createdAt?.toDate ? msg.createdAt.toDate().toLocaleString() : '-'}
                    </div>
                    <div style={{
                      marginTop: 4,
                      color: msg.status === 'unread' ? '#b1003a' : '#888',
                      fontSize: 12
                    }}>
                      {msg.status === 'unread' ? 'Unread' : 'Read'}
                    </div>
                    {msg.hasReply && <span style={{ color: "green", marginLeft: 8, fontWeight: 500 }}>[Replied]</span>}
                  </li>
                ))}
              </ul>
            </div>
            {/* Message Details */}
            <div style={{ flex: 2, paddingLeft: 24 }}>
              {selectedMessage ? (
                <div>
                  <h3>Message Details</h3>
                  <p>
                    <strong>From:</strong> {selectedMessage.name} &lt;{selectedMessage.email}&gt;
                  </p>
                  <p>
                    <strong>Received:</strong> {selectedMessage.createdAt?.toDate ? selectedMessage.createdAt.toDate().toLocaleString() : '-'}
                  </p>
                  <div
                    style={{
                      background: '#fff',
                      borderRadius: 8,
                      padding: 16,
                      margin: '18px 0',
                      minHeight: 80,
                      border: '1px solid #e0e7ef'
                    }}
                  >
                    {selectedMessage.message}
                  </div>
                  <div>
                    <ul style={{ listStyle: 'none', padding: 0 }}>
                      {replies.map(r => (
                        <li key={r.id} style={{
                          background: r.admin ? '#e9f9ee' : '#f1f3f8',
                          borderRadius: 6,
                          marginBottom: 10,
                          padding: 10
                        }}>
                          <div style={{ fontWeight: 600, color: r.admin ? '#009688' : '#1565c0' }}>
                            {r.admin ? 'Admin' : 'User'}:
                          </div>
                          <div>{r.reply}</div>
                          <div style={{ fontSize: 12, color: '#888' }}>
                            {r.repliedAt?.toDate ? r.repliedAt.toDate().toLocaleString() : ''}
                          </div>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    style={{
                      marginTop: 24,
                      padding: '8px 24px',
                      background: '#e63946',
                      color: '#fff',
                      border: 'none',
                      borderRadius: 6,
                      cursor: 'pointer'
                    }}
                    onClick={() => handleDelete(selectedMessage.id)}
                  >
                    Delete Message
                  </button>
                </div>
              ) : (
                <div style={{ color: '#888', fontStyle: 'italic', marginTop: 60 }}>
                  Select a message to view details
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default AdminInbox;
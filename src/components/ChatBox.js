import React, { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  doc,
  updateDoc,
  getDoc,
  setDoc,
} from "firebase/firestore";
import "./ChatBox.css";

export default function ChatBox({ chatId, currentUserId, otherUserId: propOtherUserId, otherUserName: propOtherUserName, onClose }) {
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [displayName, setDisplayName] = useState("");
  const messagesEndRef = useRef(null);

  // Correctly resolve "otherUserId" for both chatlist and private message scenarios
  let resolvedOtherUserId = propOtherUserId;
  let resolvedChatId = chatId;
  if (chatId && !propOtherUserId) {
    // If coming from chatlist, parse user IDs from chatId
    const ids = chatId.split("_");
    resolvedOtherUserId = ids.find((id) => id !== currentUserId);
    resolvedChatId = chatId;
  } else if (!chatId && propOtherUserId) {
    // New private message
    resolvedChatId = [currentUserId, propOtherUserId].sort().join("_");
  }

  // Always fetch display name on chat switch or new chat
  useEffect(() => {
    let isMounted = true;
    async function fetchName() {
      if (propOtherUserName) {
        setDisplayName(propOtherUserName);
      } else if (resolvedOtherUserId) {
        const userDoc = await getDoc(doc(db, "users", resolvedOtherUserId));
        if (isMounted) setDisplayName(userDoc.exists() ? userDoc.data().fullName || "Unknown" : "Unknown");
      }
    }
    fetchName();
    return () => { isMounted = false; };
  }, [resolvedOtherUserId, propOtherUserName]); // <-- update on userId or name change

  // Load messages for the resolved chat
  useEffect(() => {
    if (!resolvedChatId) return;
    const q = query(collection(db, "chats", resolvedChatId, "messages"), orderBy("timestamp"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, [resolvedChatId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!text.trim()) return;
    const chatRef = doc(db, "chats", resolvedChatId);
    const chatSnap = await getDoc(chatRef);
    let firstMessage = false;
    if (!chatSnap.exists()) {
      await setDoc(chatRef, {
        participants: [currentUserId, resolvedOtherUserId],
        lastUpdated: serverTimestamp(),
        lastMessage: text,
      });
      firstMessage = true;
    } else {
      await updateDoc(chatRef, {
        lastMessage: text,
        lastUpdated: serverTimestamp(),
      });
    }
    await addDoc(collection(db, "chats", resolvedChatId, "messages"), {
      senderId: currentUserId,
      text,
      timestamp: serverTimestamp(),
    });
    setText("");

    // Remove userId/userName from URL after first message (if needed)
    if (firstMessage && window.location.search.includes('userId')) {
      const url = new URL(window.location.href);
      url.searchParams.delete('userId');
      url.searchParams.delete('userName');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  };

  return (
    <div className="chatbox-root">
      <div className="chatbox-header">
        <span className="chatbox-title">{displayName}</span>
        <button className="chatbox-close-btn" onClick={onClose}>
          ×
        </button>
      </div>
      <div className="chatbox-messages">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`chatbox-message-row ${
              msg.senderId === currentUserId ? "right" : "left"
            }`}
          >
            <span className="chatbox-bubble">{msg.text}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <div className="chatbox-input-row">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="chatbox-input"
          placeholder="Type a message..."
          onKeyDown={(e) => {
            if (e.key === "Enter") sendMessage();
          }}
        />
        <button onClick={sendMessage} className="chatbox-send-btn">
          Send
        </button>
      </div>
    </div>
  );
}
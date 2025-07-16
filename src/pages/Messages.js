import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, query, where, orderBy, onSnapshot, getDoc, doc } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import ChatBox from "../components/ChatBox";
import { useLocation } from "react-router-dom";
import "./Messages.css";
import NavbarHome from "../components/NavbarHome";

export default function MessengerBox({ onClose }) {
  const [chats, setChats] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const [userNames, setUserNames] = useState({});
  const [search, setSearch] = useState("");
  const [showNewChatBox, setShowNewChatBox] = useState(false);
  const [manualSelection, setManualSelection] = useState(false);

  const auth = getAuth();
  const user = auth.currentUser;
  const location = useLocation();

  // Parse query params for direct messaging
  const params = new URLSearchParams(location.search);
  const directUserId = params.get("userId");
  const directUserName = params.get("userName");

  // 1. Load all chats with at least 1 message
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "chats"),
      where("participants", "array-contains", user.uid),
      orderBy("lastUpdated", "desc")
    );
    const unsub = onSnapshot(q, async (snapshot) => {
      const filteredChats = [];
      const names = {};
      await Promise.all(
        snapshot.docs.map(async (docSnap) => {
          const chatId = docSnap.id;
          const messagesQuery = query(collection(db, "chats", chatId, "messages"), orderBy("timestamp", "asc"));
          const messagesSnap = await new Promise((resolve) =>
            onSnapshot(messagesQuery, (snap) => resolve(snap))
          );
          if (!messagesSnap.empty) {
            const chatData = { id: chatId, ...docSnap.data() };
            filteredChats.push(chatData);
            const otherUid = chatData.participants.find((uid) => uid !== user.uid);
            if (otherUid && !userNames[otherUid]) {
              const userDoc = await getDoc(doc(db, "users", otherUid));
              names[otherUid] = userDoc.exists() ? userDoc.data().fullName || "Unknown" : "Unknown";
            }
          }
        })
      );
      setUserNames((prev) => ({ ...prev, ...names }));
      setChats(filteredChats);
    });
    return () => unsub();
  }, [user, userNames]);

  // 2. If we came from "Private Message" and haven't manually selected, open the chat box (even if chat doesn't exist yet)
  useEffect(() => {
    if (!user) return;
    if (manualSelection) return; // <--- Don't auto-open if user has made a manual selection!
    if (directUserId && directUserId !== user.uid) {
      const chatId = [user.uid, directUserId].sort().join("_");
      const exists = chats.some((c) => c.id === chatId);
      if (exists) {
        setActiveChatId(chatId);
        setShowNewChatBox(false);
      } else {
        setActiveChatId(null);
        setShowNewChatBox(true);
      }
    } else {
      setShowNewChatBox(false);
    }
    // eslint-disable-next-line
  }, [directUserId, chats, user, manualSelection]);

  // Filter chats by search bar (matches username or last message)
  const filteredChats = chats.filter((chat) => {
    const otherUid = chat.participants.find((uid) => uid !== user.uid);
    const displayName = userNames[otherUid] || otherUid || "Unknown";
    return (
      displayName.toLowerCase().includes(search.toLowerCase()) ||
      (chat.lastMessage && chat.lastMessage.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <>
    <NavbarHome/>
    <div className="messenger-root">
      <div className="messenger-sidebar">
        <div className="messenger-header">
          <span>Chats</span>
        </div>
        <div className="messenger-searchbar">
          <input
            type="text"
            className="messenger-search-input"
            placeholder="Search names…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="messenger-chats">
          {filteredChats.length === 0 ? (
            <div style={{ color: "#a0a0a0", padding: "40px 0 0 0", textAlign: "center" }}>
              No conversations found.
            </div>
          ) : (
            filteredChats.map((chat) => {
              const otherUid = chat.participants.find((uid) => uid !== user.uid);
              const displayName = userNames[otherUid] || otherUid || "Unknown";
              return (
                <div
                  className={`messenger-chat${activeChatId === chat.id ? " selected" : ""}`}
                  key={chat.id}
                  onClick={() => {
                    setActiveChatId(chat.id);
                    setShowNewChatBox(false);
                    setManualSelection(true); // <-- Set manual selection!
                  }}
                >
                  <img
                    className="messenger-avatar"
                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                      displayName
                    )}&background=0D8ABC&color=fff&size=128`}
                    alt={displayName}
                  />
                  <div className="messenger-chat-info">
                    <div className="messenger-chat-name">{displayName}</div>
                    <div className="messenger-chat-lastmsg">
                      {chat.lastMessage || (
                        <span className="messenger-lastmsg-empty">
                          No messages yet
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
      <div className="messenger-chat-area">
        {activeChatId ? (
          <ChatBox
            chatId={activeChatId}
            currentUserId={user.uid}
            onClose={() => setActiveChatId(null)}
          />
        ) : showNewChatBox && directUserId ? (
          <ChatBox
            chatId={null}
            currentUserId={user.uid}
            otherUserId={directUserId}
            otherUserName={directUserName}
            onClose={() => setShowNewChatBox(false)}
          />
        ) : (
          <div className="messenger-placeholder">
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
    </>
  );
}
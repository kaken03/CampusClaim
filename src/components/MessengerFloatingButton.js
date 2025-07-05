import React from 'react';

function MessengerFloatingButton({ onClick, unreadCount }) {
  return (
    <button
      onClick={onClick}
      style={{
        position: 'fixed',
        left: 24,
        top: 70,
        zIndex: 2000,
        background: '#007BFF',
        color: '#fff',
        border: 'none',
        borderRadius: '50%',
        width: 56,
        height: 56,
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        fontSize: 28,
        cursor: 'pointer',
      }}
      aria-label="Open Messenger"
    >
      💬
      
    </button>
  );
}

export default MessengerFloatingButton;
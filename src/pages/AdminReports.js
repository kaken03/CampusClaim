// src/pages/AdminReport.js
import React, { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, getDocs, doc, getDoc, deleteDoc } from "firebase/firestore";
import Navbar from "../components/AdminNavbar";
import "./AdminReports.css";

export default function AdminReport() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState(null);
  const [expanded, setExpanded] = useState(false);
  const [selectedReports, setSelectedReports] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [manageMode, setManageMode] = useState(false); // 🔹 New state
  const [actionMessage, setActionMessage] = useState('');

  useEffect(() => {
    setLoading(true);

    const fetchReports = async () => {
      const postsRef = collection(db, "schools", "Consolatrix College of Toledo City", "LostItems");
      const postsSnapshot = await getDocs(postsRef);
      let allReports = [];

      for (const postDoc of postsSnapshot.docs) {
        const postId = postDoc.id;
        const reportsRef = collection(db, "schools", "Consolatrix College of Toledo City", "LostItems", postId, "reports");
        const reportsSnapshot = await getDocs(reportsRef);

        reportsSnapshot.forEach(reportDoc => {
          allReports.push({
            id: reportDoc.id,
            postId,
            ...reportDoc.data(),
          });
        });
      }

      allReports.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB - dateA;
      });

      setReports(allReports);
      setLoading(false);
    };

    fetchReports();
  }, []);

  const handleViewPost = async (postId) => {
    try {
      const postRef = doc(db, "schools", "Consolatrix College of Toledo City", "LostItems", postId);
      const postSnap = await getDoc(postRef);

      if (postSnap.exists()) {
        const postData = postSnap.data();
        setSelectedPost({
          author: postData.authorName,
          text: postData.text,
          imageUrl: postData.imageUrl || null,
        });
        setExpanded(false);
      } else {
        alert("This post no longer exists.");
      }
    } catch (error) {
      console.error("Error fetching post:", error);
      alert("Failed to load post details.");
    }
  };

  const closeModal = () => setSelectedPost(null);

  const toggleSelect = (reportId) => {
    setSelectedReports((prev) =>
      prev.includes(reportId) ? prev.filter((id) => id !== reportId) : [...prev, reportId]
    );
  };

  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedReports([]);
    } else {
      setSelectedReports(reports.map((r) => r.id));
    }
    setSelectAll(!selectAll);
  };

  const deleteSelectedReports = async () => {
  if (selectedReports.length === 0) {
    setActionMessage("No reports selected.");
    setTimeout(() => setActionMessage(''), 2000);
    return;
  }
  if (!window.confirm("Delete selected reports?")) return;

  try {
    await Promise.all(
      selectedReports.map((reportId) => {
        const report = reports.find((r) => r.id === reportId);
        const reportRef = doc(
          db,
          "schools",
          "Consolatrix College of Toledo City",
          "LostItems",
          report.postId,
          "reports",
          report.id
        );
        return deleteDoc(reportRef);
      })
    );

    setReports((prev) => prev.filter((r) => !selectedReports.includes(r.id)));
    setSelectedReports([]);
    setSelectAll(false);
    setActionMessage("Selected reports deleted successfully.");
    setTimeout(() => setActionMessage(''), 2000);
  } catch (error) {
    console.error("Error deleting reports:", error);
    setActionMessage("Failed to delete selected reports.");
    setTimeout(() => setActionMessage(''), 2000);
  }
};

  const deleteAllReports = async () => {
    if (!window.confirm("Are you sure you want to delete ALL reports?")) return;

    try {
      await Promise.all(
        reports.map((report) => {
          const reportRef = doc(
            db,
            "schools",
            "Consolatrix College of Toledo City",
            "LostItems",
            report.postId,
            "reports",
            report.id
          );
          return deleteDoc(reportRef);
        })
      );

      setReports([]);
      setSelectedReports([]);
      setSelectAll(false);
      setActionMessage("All reports deleted successfully.");
    setTimeout(() => setActionMessage(''), 2000);
      // alert("All reports deleted successfully.");
    } catch (error) {
      console.error("Error deleting all reports:", error);
      setActionMessage("Failed to delete all reports.");
    setTimeout(() => setActionMessage(''), 2000);
      // alert("Failed to delete all reports.");
    }
  };
  
  const copyToClipboard = async (value, label) => {
  // 1. Clear previous message
  setActionMessage(''); 

  // 2. Try modern Clipboard API (navigator.clipboard)
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(value);
      setActionMessage(`${label} copied!`);
      setTimeout(() => setActionMessage(''), 1500);
      return; // Success, exit function
    } catch (err) {
      console.error("Modern Clipboard API failed:", err);
      // Fall through to the older method if the modern one fails
    }
  }

  // 3. Fallback method using document.execCommand (for older/restricted environments)
  try {
    const textArea = document.createElement("textarea");
    textArea.value = value;
    textArea.style.position = "fixed"; // Prevents scrolling to bottom of page
    textArea.style.opacity = "0"; // Make it invisible
    document.body.appendChild(textArea);
    
    // Select the text and copy
    textArea.focus();
    textArea.select();
    document.execCommand('copy');
    
    document.body.removeChild(textArea);
    setActionMessage(`${label} copied!`);
  } catch (err) {
    console.error("Fallback copy failed:", err);
    setActionMessage(`Failed to copy ${label}. Please copy manually.`);
  }

  // 4. Clear message after 1.5s
  setTimeout(() => setActionMessage(''), 1500);
};

  return (
    <div className="admin-reports-page">
      <Navbar />
      
      <div className="admin-report">
        {actionMessage && (
        <div className="postbox-action-message">{actionMessage}</div>
      )}
        <div className="report-container">
          
          <h2>All Reports</h2>

          {loading ? (
            <p>Loading reports...</p>
          ) : reports.length === 0 ? (
            <p>No reports found.</p>
          ) : (
            <>
              {/* 🔹 Manage Mode Toggle Button */}
              <div className="report-actions">
                <button
                  className="manage-btn"
                  onClick={() => setManageMode(!manageMode)}
                >
                  {manageMode ? "Exit" : "Manage"}
                </button>

                {manageMode && (
                  <>
                    <button onClick={deleteSelectedReports} className="delete-btn">
                      Delete Selected
                    </button>
                    <button onClick={deleteAllReports} className="delete-btn danger">
                      Delete All
                    </button>
                  </>
                )}
              </div>

              <table className="report-table">
                <thead>
                  <tr>
                    {manageMode && (
                      <th>
                        <input
                          type="checkbox"
                          checked={selectAll}
                          onChange={toggleSelectAll}
                        />
                      </th>
                    )}
                    <th>Post ID</th>
                    <th>Reason</th>
                    <th>Reporter ID</th>
                    <th>Reported At</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {reports.map((report) => (
                    <tr key={report.id}>
                      {manageMode && (
                        <td>
                          <input
                            type="checkbox"
                            checked={selectedReports.includes(report.id)}
                            onChange={() => toggleSelect(report.id)}
                          />
                        </td>
                      )}
                      <td data-label="Post ID">
                      <p>
                        
                        {report.postId ? (
                          <span
                            className="clickable-id"
                            onClick={() => copyToClipboard(report.postId, "Post ID")}
                            title="Click to copy Post ID"
                            style={{ cursor: 'pointer', color: '#1877f2' }}
                          >
                            {report.postId}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </p>
                    </td>
                      <td data-label="Reason">{report.reason}</td>
                      <td data-label="Reporter ID">
                      <p>
                        
                        {report.reporterId ? (
                          <span
                            className="clickable-id"
                            onClick={() => copyToClipboard(report.reporterId, "Reporter ID")}
                            title="Click to copy Reporter ID"
                            style={{ cursor: 'pointer', color: '#1877f2' }}
                          >
                            {report.reporterId}
                          </span>
                        ) : (
                          'N/A'
                        )}
                      </p>
                    </td>
                      <td data-label="Created At">
                        {report.createdAt?.toDate
                          ? report.createdAt.toDate().toLocaleString()
                          : report.createdAt}
                      </td>
                      <td data-label="Action">
                        <button
                          className="view-btn"
                          onClick={() => handleViewPost(report.postId)}
                        >
                          View Post
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>

        {/* Modal */}
        {selectedPost && (
          <div className="ui-modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <button className="close-btn" onClick={closeModal}>
                  ✕
                </button>
              </div>
              <div className="modal-body">
                <p className="post-author">
                  <span className="label">Author:</span> {selectedPost.author}
                </p>
                <div className="post-text">
                  <span className="label">Text:</span>{" "}
                  {expanded
                    ? selectedPost.text
                    : selectedPost.text.length > 150
                    ? selectedPost.text.slice(0, 150) + "..."
                    : selectedPost.text}
                  {selectedPost.text.length > 150 && (
                    <button
                      className="toggle-btn"
                      onClick={() => setExpanded(!expanded)}
                    >
                      {expanded ? "Show Less" : "Read More"}
                    </button>
                  )}
                </div>
                {selectedPost.imageUrl && (
                  <div className="post-image-wrapper">
                    <img
                      src={selectedPost.imageUrl}
                      alt="Post"
                      className="modal-image"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

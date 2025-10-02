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

  useEffect(() => {
    const fetchReports = async () => {
      try {
        let allReports = [];
        const postsSnapshot = await getDocs(
          collection(db, "schools", "Consolatrix College of Toledo City", "LostItems")
        );

        for (const postDoc of postsSnapshot.docs) {
          const postId = postDoc.id;
          const reportsSnapshot = await getDocs(
            collection(db, "schools", "Consolatrix College of Toledo City", "LostItems", postId, "reports")
          );

          reportsSnapshot.forEach((reportDoc) => {
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
      } catch (error) {
        console.error("Error fetching reports:", error);
        setLoading(false);
      }
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
    if (selectedReports.length === 0) return alert("No reports selected.");
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
      alert("Selected reports deleted successfully.");
    } catch (error) {
      console.error("Error deleting reports:", error);
      alert("Failed to delete selected reports.");
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
      alert("All reports deleted successfully.");
    } catch (error) {
      console.error("Error deleting all reports:", error);
      alert("Failed to delete all reports.");
    }
  };

  return (
    <div>
      <Navbar />
      <div className="admin-report">
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
                    <th>Created At</th>
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
                      <td data-label="Post ID">{report.postId}</td>
                      <td data-label="Reason">{report.reason}</td>
                      <td data-label="Reporter ID">{report.reporterId}</td>
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
          <div className="modal-overlay">
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

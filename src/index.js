import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import SchoolHome from './pages/SchoolHome';
import Profile from './pages/Profile';
import Timeline from './pages/Timeline';
import Notification from './pages/Notification';
import reportWebVitals from './reportWebVitals';
import PostDetails from './components/PostDetails';

// Admin pages
import AdminDashboard from './pages/AdminDashboard';
import AdminTimeline from './pages/AdminTimeline';
import AdminNotification from './pages/AdminNotification';
import AdminUser from './pages/AdminUser';
import AdminPosts from './pages/AdminPosts';
import AdminApproval from './pages/AdminApproval';
import AdminReports from './pages/AdminReports';
import AdminProfile from './pages/AdminProfile';

// Auth & protection
import RequireUser from './components/RequireUser';
import RequireAdmin from './components/RequireAdmin';
import ForgotPassword from './pages/ForgotPassword';
import RequireGuest from './components/RequireGuest'; // ✅ new wrapper

// ✅ AuthProvider
import { AuthProvider } from './context/Authcontext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <AuthProvider>
      <Router>
        <Routes>
  {/* Guest-only pages */}
  <Route path="/" element={
    <RequireGuest>
      <App />
    </RequireGuest>
  } />
  <Route path="/login" element={
    <RequireGuest>
      <Login />
    </RequireGuest>
  } />
  <Route path="/signup" element={
    <RequireGuest>
      <Signup />
    </RequireGuest>
  } />
  <Route path="/forgot-password" element={<ForgotPassword />} />

  {/* User Protected Routes */}
  <Route path="/home" element={
    <RequireUser>
      <Home />
    </RequireUser>
  } />
  <Route path="/school/:schoolName/home" element={
    <RequireUser>
      <SchoolHome />
    </RequireUser>
  } />
  <Route path="/profile" element={
    <RequireUser>
      <Profile />
    </RequireUser>
  } />
  <Route path="/timeline" element={
    <RequireUser>
      <Timeline />
    </RequireUser>
  } />
  <Route path="/notifications" element={
    <RequireUser>
      <Notification />
    </RequireUser>
  } />
  <Route path="/post/:postId" element={
    <RequireUser>
      <PostDetails />
    </RequireUser>
  } />

  {/* Admin Protected Routes */}
  <Route path="/admin-dashboard" element={
    <RequireAdmin>
      <AdminDashboard />
    </RequireAdmin>
  } />
  <Route path="/admin-timeline" element={
    <RequireAdmin>
      <AdminTimeline />
    </RequireAdmin>
  } />
  <Route path="/admin-notifications" element={
    <RequireAdmin>
      <AdminNotification />
    </RequireAdmin>
  } />
  <Route path="/admin-posts" element={
    <RequireAdmin>
      <AdminPosts />
    </RequireAdmin>
  } />
  <Route path="/admin-approval" element={
    <RequireAdmin>
      <AdminApproval />
    </RequireAdmin>
  } />
  <Route path="/admin-users" element={
    <RequireAdmin>
      <AdminUser />
    </RequireAdmin>
  } />
  <Route path="/admin-reports" element={
    <RequireAdmin>
      <AdminReports />
    </RequireAdmin>
  } />
  <Route path="/admin-profile" element={
    <RequireAdmin>
      <AdminProfile />
    </RequireAdmin>
  } />
</Routes>
      </Router>
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();

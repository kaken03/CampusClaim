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
import ContactUs from './pages/ContactUs';
import reportWebVitals from './reportWebVitals';
import PostDetails from './components/PostDetails';
import AdminDashboard from './pages/AdminDashboard';
import AdminUser from './pages/AdminUser';
import AdminPosts from './pages/AdminPosts'
import AdminApproval from './pages/AdminApproval';
import AdminAnalytics from './pages/AdminAnalytics';
import AdminInbox from './pages/AdminInbox'; // New admin inbox page
import RequireUser from './components/RequireUser';
import RequireAdmin from './components/RequireAdmin';
import ForgotPassword from './pages/ForgotPassword';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
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

        {/* Public Info Pages */}
        <Route path="/contact" element={<ContactUs />} />

        {/* Admin Protected Routes */}
        <Route path="/admin-dashboard" element={
          <RequireAdmin>
            <AdminDashboard />
          </RequireAdmin>
        } />
        <Route path="/admin-analytics" element={
          <RequireAdmin>
            <AdminAnalytics />
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
        <Route path="/admin-inbox" element={
          <RequireAdmin>
            <AdminInbox />
          </RequireAdmin>
        } />
        {/* Add more admin-protected routes below as needed */}

      </Routes>
    </Router>
  </React.StrictMode>
);

reportWebVitals();
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './index.css';
import App from './App';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Home from './pages/Home';
import Profile from './pages/Profile';
import Timeline from './pages/Timeline';
import Notification from './pages/Notification';
import About from './pages/About';
import ContactUs from './pages/ContactUs';
import reportWebVitals from './reportWebVitals';
import PostDetails from './components/PostDetails';
import AdminDashboard from './pages/AdminDashboard';
import AdminUser from './pages/AdminUser';
import AdminPosts from './pages/AdminPosts'
import AdminAnalytics from './pages/AdminAnalytics';
import RequireUser from './components/RequireUser';
import RequireAdmin from './components/RequireAdmin';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* User Protected Routes */}
        <Route path="/home" element={
          <RequireUser>
            <Home />
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
        <Route path="/about" element={<About />} />
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
        <Route path="/admin-users" element={
          <RequireAdmin>
            <AdminUser />
          </RequireAdmin>
        } />
        {/* Add more admin-protected routes below as needed */}

      </Routes>
    </Router>
  </React.StrictMode>
);

reportWebVitals();
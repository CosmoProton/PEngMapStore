import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth.jsx';
import ToastContainer from './components/ToastContainer.jsx';

import Home         from './pages/Home.jsx';
import Login        from './pages/Login.jsx';
import Submit       from './pages/Submit.jsx';
import Admin        from './pages/Admin.jsx';
import AuthCallback from './pages/AuthCallback.jsx';
import Contributors from './pages/Contributors.jsx';
import TasksAdmin   from './pages/TasksAdmin.jsx';
import TasksStudent from './pages/TasksStudent.jsx';

import Navbar from './components/Navbar.jsx';
import { useAuth } from './hooks/useAuth.jsx';

function Protected({ children, adminOnly = false }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/"               element={<Protected><Home /></Protected>} />
      <Route path="/submit"         element={<Protected><Submit /></Protected>} />
      <Route path="/admin"          element={<Protected adminOnly><Admin /></Protected>} />
      <Route path="/admin/tasks"    element={<Protected adminOnly><TasksAdmin /></Protected>} />
      <Route path="/tasks"          element={<Protected><TasksStudent /></Protected>} />
      
      <Route path="/login"          element={<Login />} />
      <Route path="/auth/callback"  element={<AuthCallback />} />
      <Route path="/contributors"  element={<Contributors />} />
      <Route path="*"               element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
          <Navbar />
          <main className="flex-1">
            <AppRoutes />
          </main>
        </div>
        <ToastContainer />
      </AuthProvider>
    </BrowserRouter>
  );
}

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Analytics } from '@vercel/analytics/react';
import { AuthProvider, useAuth } from './hooks/useAuth.jsx';
import { Navbar }       from './components/Navbar.jsx';
import Login            from './pages/Login.jsx';
import Home             from './pages/Home.jsx';
import Submit           from './pages/Submit.jsx';
import Admin            from './pages/Admin.jsx';
import AuthCallback     from './pages/AuthCallback.jsx';
import Contributors     from './pages/Contributors.jsx';
import TasksAdmin 		from './pages/TasksAdmin';
import TasksAdmin		from './pages/TasksAdmin';
import TasksStudent 	from './pages/TasksStudent';


function Protected({ children, adminOnly = false }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace/>;
  if (adminOnly && !['admin','superadmin','teacher'].includes(user.user_status)) return <Navigate to="/" replace/>;
  return children;
}

function AppRoutes() {
  const { user } = useAuth();
  return (
    <>
      <Navbar/>
      <Routes>
        <Route path="/login"         element={user ? <Navigate to="/"/> : <Login/>}/>
        <Route path="/auth/callback" element={<AuthCallback/>}/>
        <Route path="/contributors"  element={<Contributors/>}/>
        <Route path="/"      	     element={<Protected><Home/></Protected>}/>
        <Route path="/submit" 	     element={<Protected><Submit/></Protected>}/>
        <Route path="/admin"  	     element={<Protected adminOnly><Admin/></Protected>}/>
		<Route path="/admin/tasks"   element={<TasksAdmin />} />
		<Route path="/admin/tasks" element={<TasksAdmin />} />
		<Route path="/tasks" element={<TasksStudent />} />
        <Route path="*"       	     element={<Navigate to="/"/>}/>
      </Routes>
    </>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes/>
      </AuthProvider>
    <Analytics />
    </BrowserRouter>
  );
}

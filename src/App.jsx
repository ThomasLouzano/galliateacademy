import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import Home from './pages/Home';
import Trail from './pages/Trail';
import Course from './pages/Course';
import Lesson from './pages/Lesson';
import Quiz from './pages/Quiz';
import Certificate from './pages/Certificate';
import Ranking from './pages/Ranking';
import Profile from './pages/Profile';
import Manager from './pages/Manager';

function RequireAuth() {
  const { user, loading } = useAuth();
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F9A800', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, letterSpacing: 2 }}>
      CARREGANDO...
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RequireManager() {
  const { userRole } = useAuth();
  if (userRole !== 'manager') return <Navigate to="/" replace />;
  return <Outlet />;
}

function AppLayout() {
  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0D0D0D' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        <Outlet />
      </main>
    </div>
  );
}

function LoginPage() {
  const { user, loading } = useAuth();
  if (loading) return null;
  if (user) return <Navigate to="/" replace />;
  return <Login />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<AppLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/trail/:trailId" element={<Trail />} />
              <Route path="/course/:trailId/:courseId" element={<Course />} />
              <Route path="/lesson/:trailId/:courseId/:lessonId" element={<Lesson />} />
              <Route path="/quiz/:trailId/:courseId" element={<Quiz />} />
              <Route path="/certificate/:trailId/:courseId" element={<Certificate />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/profile" element={<Profile />} />
              <Route element={<RequireManager />}>
                <Route path="/manager" element={<Manager />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

import { useState } from 'react';
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
import Module from './pages/Module';
import VideoPlayer from './pages/VideoPlayer';
import AvaliacaoPage from './pages/AvaliacaoPage';
import CertificadoPage from './pages/CertificadoPage';
import MeusCertificadosPage from './pages/MeusCertificadosPage';

function RequireAuth() {
  const auth = useAuth();
  if (!auth) return null;
  const { user, loading } = auth;
  if (loading) return (
    <div style={{ minHeight: '100vh', background: '#0D0D0D', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#F9A800', fontFamily: 'Barlow Condensed, sans-serif', fontSize: 18, letterSpacing: 2 }}>
      CARREGANDO...
    </div>
  );
  if (!user) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function RequireManager() {
  const auth = useAuth();
  if (!auth) return null;
  const { userRole } = auth;
  if (userRole !== 'manager') return <Navigate to="/" replace />;
  return <Outlet />;
}

function AppLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const close = () => setSidebarOpen(false);

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-overlay" onClick={close} />}
      <Sidebar isOpen={sidebarOpen} onClose={close} />
      <main className="app-main">
        {/* top bar mobile */}
        <div className="topbar">
          <button className="hamburger" onClick={() => setSidebarOpen(o => !o)} aria-label="Menu">
            <span /><span /><span />
          </button>
          <span style={{ fontFamily: 'Barlow Condensed, sans-serif', fontWeight: 900, fontSize: 18, color: '#F9A800', letterSpacing: 2 }}>
            GALLIATE ACADEMY
          </span>
        </div>
        <Outlet />
      </main>
    </div>
  );
}

function LoginPage() {
  const auth = useAuth();
  if (!auth) return null;
  const { user, loading } = auth;
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
              <Route path="/modulo/:id" element={<Module />} />
              <Route path="/ranking" element={<Ranking />} />
              <Route path="/certificados" element={<MeusCertificadosPage />} />
              <Route path="/profile" element={<Profile />} />
              <Route element={<RequireManager />}>
                <Route path="/manager" element={<Manager />} />
              </Route>
            </Route>
            <Route path="/modulo/:moduloId/aula/:aulaId" element={<VideoPlayer />} />
            <Route path="/modulo/:moduloId/avaliacao" element={<AvaliacaoPage />} />
          </Route>
          <Route path="/certificado/:codigo" element={<CertificadoPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

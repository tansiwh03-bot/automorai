
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider, useAuth } from './context/AuthContext';
import Index from './pages/Index';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import ConnectWhatsApp from './pages/ConnectWhatsApp';
import ConnectPixelGA from './pages/ConnectPixelGA';
import BuyPackage from './pages/BuyPackage';
import PrivacyPolicy from './pages/PrivacyPolicy';

// Tender moved to its own site (tendermasterbd.com, user 2026-11-21) — old links redirect there.
const ToTenderMaster = () => { window.location.replace('https://tendermasterbd.com'); return null; };

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  if (isLoading) {
    return (
      <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#06070a', color:'#8b90a3'}}>
        Loading...
      </div>
    );
  }
  return user ? <>{children}</> : <Navigate to="/login" />;
};

const AppRoutes = () => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{minHeight:'100vh', display:'flex', alignItems:'center', justifyContent:'center', background:'#06070a', color:'#8b90a3'}}>
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/privacy" element={<PrivacyPolicy />} />
      <Route path="/tender-trial" element={<ToTenderMaster />} />
      <Route path="/tender-guide" element={<ToTenderMaster />} />
      <Route path="/connect-tender" element={<ToTenderMaster />} />
      <Route path="/login" element={user ? <Navigate to="/dashboard" /> : <Login />} />
      <Route path="/signup" element={user ? <Navigate to="/dashboard" /> : <Signup />} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      <Route path="/connect-whatsapp" element={
        <ProtectedRoute>
          <ConnectWhatsApp />
        </ProtectedRoute>
      } />
      <Route path="/connect-pixel-ga" element={
        <ProtectedRoute>
          <ConnectPixelGA />
        </ProtectedRoute>
      } />
      <Route path="/buy-package" element={
        <ProtectedRoute>
          <BuyPackage />
        </ProtectedRoute>
      } />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster />
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;

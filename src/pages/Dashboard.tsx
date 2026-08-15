import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-primary mb-6">
          Welcome to Automorai
        </h1>
        <p className="text-lg text-muted-foreground">
          Hello, {user.email}! Your dashboard is ready.
        </p>
        <button
          onClick={() => {
            logout();
            navigate('/login');
          }}
          className="mt-8 px-6 py-3 bg-primary text-primary-foreground hover:bg-primary/80 transition-colors rounded-lg"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
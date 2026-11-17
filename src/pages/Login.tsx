import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import {
  Input,
} from '@/components/ui/input';
import {
  Button,
} from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const CHECK_EMAIL_API = 'https://n8n2.kingpurefood.com/webhook/automorai/check-email-exists';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [resetting, setResetting] = useState(false);
  const [loginError, setLoginError] = useState('');
  const [loginErrorField, setLoginErrorField] = useState<'email' | 'password' | null>(null);
  const { login, resetPassword } = useAuth();
  const navigate = useNavigate();

  const clearLoginError = () => { setLoginError(''); setLoginErrorField(null); };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearLoginError();
    setLoading(true);
    try {
      const result = await login(email, password);
      if (result.success) {
        toast.success('Logged in successfully!');
        navigate('/dashboard');
        return;
      }

      // Login failed — check whether this email is even registered, so we can
      // tell the user specifically which field is wrong instead of one generic message.
      try {
        const checkRes = await fetch(CHECK_EMAIL_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email }),
        });
        const checkData = await checkRes.json();
        if (checkData.success && checkData.exists) {
          setLoginError('Incorrect password. Please try again.');
          setLoginErrorField('password');
        } else if (checkData.success && !checkData.exists) {
          setLoginError('No account found with this email.');
          setLoginErrorField('email');
        } else {
          setLoginError('These credentials do not match our records.');
          setLoginErrorField('email');
        }
      } catch {
        setLoginError('These credentials do not match our records.');
        setLoginErrorField('email');
      }
    } catch (err) {
      setLoginError('These credentials do not match our records.');
      setLoginErrorField('email');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Please enter your email above first, then click "Forgot password?"');
      return;
    }
    setResetting(true);
    try {
      const result = await resetPassword(email);
      if (result.success) {
        toast.success(`Password reset link sent to ${email}. Please check your inbox.`);
      } else {
        toast.error(result.error || 'Could not send reset link. Please try again.');
      }
    } catch (err) {
      toast.error('Could not send reset link. Please try again.');
    } finally {
      setResetting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader className="pb-6">
          <CardTitle className="text-2xl">Login to Automorai</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => { setEmail(e.target.value); clearLoginError(); }}
                required
                disabled={loading}
                className={loginErrorField === 'email' ? 'border-destructive focus-visible:ring-destructive' : ''}
              />
              {loginErrorField === 'email' && (
                <p className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertCircle size={14} />
                  {loginError}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  disabled={resetting}
                  className="text-sm text-primary hover:underline"
                >
                  {resetting ? 'Sending...' : 'Forgot password?'}
                </button>
              </div>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearLoginError(); }}
                  required
                  disabled={loading}
                  className={`pr-10 ${loginErrorField === 'password' ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {loginErrorField === 'password' && (
                <p className="flex items-center gap-1.5 text-sm text-destructive">
                  <AlertCircle size={14} />
                  {loginError}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col items-center space-y-3 pt-4">
          <p className="text-sm text-muted-foreground">
            Don't have an account?{' '}
            <a href="/signup" className="text-primary hover:underline">
              Sign up
            </a>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { login, signupStep1, verifySignup, resendSignupOTP } from '../utils/api';
import { getDefaultRouteForRole } from '../utils/roleRoutes';
import AuthLayout from './AuthLayout';
import PasswordInput from './PasswordInput';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

function Login({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [signupStep, setSignupStep] = useState(1);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await login(email, password);
      if (result.success) {
        onLogin(result.user);
        navigate(getDefaultRouteForRole(result.user.role));
      } else {
        setError(result.message || 'Invalid credentials');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignupStep1 = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    setLoading(true);
    try {
      const result = await signupStep1(firstName, lastName, email, password);
      if (result.success) {
        setSuccess('Verification code sent to your email. Please enter it below.');
        setSignupStep(2);
        setResendCooldown(60);
        const intervalId = setInterval(() => {
          setResendCooldown((prev) => {
            if (prev <= 1) {
              clearInterval(intervalId);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      } else {
        setError(result.message || 'Signup failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySignup = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await verifySignup(email, otp);
      if (result.success && result.data?.user) {
        const user = { ...result.data.user, id: result.data.user.id || result.data.user._id };
        onLogin(user);
        navigate(getDefaultRouteForRole(user.role));
      } else {
        setError(result.message || 'Verification failed. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0) return;
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const result = await resendSignupOTP(email);
      if (result.success) {
        setSuccess('A new verification code has been sent.');
        setResendCooldown(60);
      } else {
        setError(result.message || 'Failed to resend code.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to resend code.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsSignup(!isSignup);
    setSignupStep(1);
    setError('');
    setSuccess('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setFirstName('');
    setLastName('');
    setOtp('');
  };

  const goBackToSignupForm = () => {
    setSignupStep(1);
    setError('');
    setSuccess('');
    setOtp('');
  };

  const feedback = (
    <>
      {error && (
        <Alert variant="destructive">
          <AlertCircle />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      {success && (
        <Alert variant="success">
          <CheckCircle2 />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
    </>
  );

  const title = isSignup ? (signupStep === 1 ? 'Create Account' : 'Verify Email') : 'Sign In';

  return (
    <AuthLayout title={title} subtitle="Access your application portal">
      {isSignup ? (
        signupStep === 1 ? (
          <form onSubmit={handleSignupStep1} className="space-y-5">
            {feedback}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                  id="firstName"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="First name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                  id="lastName"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Last name"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-email">Email Address</Label>
              <Input
                type="email"
                id="signup-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="signup-password">Password</Label>
              <PasswordInput
                id="signup-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Min. 6 characters"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <PasswordInput
                id="confirm-password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                placeholder="Confirm your password"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="animate-spin" />}
              {loading ? 'Sending verification code...' : 'Continue'}
            </Button>

            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{' '}
              <button type="button" onClick={toggleMode} className="font-medium text-primary hover:underline">
                Login
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleVerifySignup} className="space-y-5">
            {feedback}

            <p className="text-sm text-muted-foreground">
              We sent a 6-digit code to <strong className="text-foreground">{email}</strong>
            </p>

            <div className="space-y-2">
              <Label htmlFor="otp">Verification Code</Label>
              <Input
                id="otp"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                required
                placeholder="Enter 6-digit code"
                maxLength={6}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="text-center text-lg tracking-[0.5em]"
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading || otp.length !== 6}>
              {loading && <Loader2 className="animate-spin" />}
              {loading ? 'Verifying...' : 'Verify & Create Account'}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={resendCooldown > 0 || loading}
                className="text-sm font-medium text-primary hover:underline disabled:text-muted-foreground disabled:no-underline"
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend verification code'}
              </button>
            </div>

            <div className="flex flex-col items-center gap-2 text-sm">
              <button type="button" onClick={goBackToSignupForm} className="font-medium text-muted-foreground hover:text-foreground">
                ← Back to signup form
              </button>
              <p className="text-muted-foreground">
                Already have an account?{' '}
                <button type="button" onClick={toggleMode} className="font-medium text-primary hover:underline">
                  Login
                </button>
              </p>
            </div>
          </form>
        )
      ) : (
        <form onSubmit={handleLogin} className="space-y-5">
          {feedback}

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="Enter your email"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link to="/forgot-password" className="text-xs font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <PasswordInput
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Enter your password"
            />
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading && <Loader2 className="animate-spin" />}
            {loading ? 'Logging in...' : 'Login'}
          </Button>

          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <button type="button" onClick={toggleMode} className="font-medium text-primary hover:underline">
              Create Account
            </button>
          </p>
        </form>
      )}
    </AuthLayout>
  );
}

export default Login;

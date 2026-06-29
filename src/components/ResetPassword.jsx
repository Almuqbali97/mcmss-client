import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { resetPassword } from '../utils/api';
import AuthLayout from './AuthLayout';
import PasswordInput from './PasswordInput';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

function ResetPassword() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing reset link. Please request a new password reset.');
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!token) return;

    setLoading(true);
    try {
      const result = await resetPassword(token, newPassword);
      if (result.success) {
        setSuccess('Your password has been reset. Redirecting to login...');
        setTimeout(() => navigate('/login'), 2000);
      } else {
        setError(result.message || 'Failed to reset password. The link may have expired.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <AuthLayout title="Reset Password" subtitle="Link expired or invalid">
        <div className="space-y-5">
          <Alert variant="destructive">
            <AlertCircle />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <p className="text-center text-sm text-muted-foreground">
            <Link to="/forgot-password" className="font-medium text-primary hover:underline">
              Request a new reset link
            </Link>
            {' or '}
            <Link to="/login" className="font-medium text-primary hover:underline">
              Back to Login
            </Link>
          </p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Reset Password" subtitle="Choose a new password">
      <form onSubmit={handleSubmit} className="space-y-5">
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

        <p className="text-sm text-muted-foreground">Enter your new password below.</p>

        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <PasswordInput
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Min. 6 characters"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm Password</Label>
          <PasswordInput
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={6}
            placeholder="Confirm new password"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          {loading ? 'Resetting...' : 'Reset Password'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default ResetPassword;

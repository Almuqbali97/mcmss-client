import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { changePassword } from '../utils/api';
import AuthLayout from './AuthLayout';
import PasswordInput from './PasswordInput';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

function ChangePassword({ onLogout }) {
  const navigate = useNavigate();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (newPassword !== confirmPassword) {
      setError('New password and confirmation do not match.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters long.');
      return;
    }

    setLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      setSuccess('Password changed successfully. You will be logged out.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => {
        onLogout();
        navigate('/login');
      }, 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to change password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Change Password" subtitle="Update your account credentials">
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

        <p className="text-sm text-muted-foreground">
          Enter your current password and choose a new password.
        </p>

        <div className="space-y-2">
          <Label htmlFor="currentPassword">Current Password</Label>
          <PasswordInput
            id="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            required
            placeholder="Enter current password"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="newPassword">New Password</Label>
          <PasswordInput
            id="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Min. 8 characters"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <PasswordInput
            id="confirmPassword"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            placeholder="Confirm new password"
          />
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          {loading ? 'Changing...' : 'Change Password'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          <button type="button" className="font-medium text-primary hover:underline" onClick={() => navigate(-1)}>
            Back to Dashboard
          </button>
        </p>
      </form>
    </AuthLayout>
  );
}

export default ChangePassword;

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { forgotPassword } from '../utils/api';
import AuthLayout from './AuthLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';

function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const result = await forgotPassword(email);
      if (result.success) {
        setSuccess('If an account exists with this email, a password reset link has been sent.');
        setEmail('');
      } else {
        setError(result.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout title="Forgot Password" subtitle="We'll send you a reset link">
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
          Enter your email address and we'll send you a link to reset your password.
        </p>

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

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="animate-spin" />}
          {loading ? 'Sending...' : 'Send Reset Link'}
        </Button>

        <p className="text-center text-sm text-muted-foreground">
          Remember your password?{' '}
          <Link to="/login" className="font-medium text-primary hover:underline">
            Back to Login
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

export default ForgotPassword;

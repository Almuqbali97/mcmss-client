import { useState } from 'react';
import { Link } from 'react-router-dom';
import { forgotPassword } from '../utils/api';
import AuthLayout from './AuthLayout';

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
      <form onSubmit={handleSubmit} className="login-form">
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <p className="auth-hint">
          Enter your email address and we'll send you a link to reset your password.
        </p>

        <div className="form-group">
          <label htmlFor="email">Email Address</label>
          <input
            type="email"
            id="email"
            className="form-control"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="Enter your email"
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? (
            <span className="btn-loading">
              <span className="spinner"></span>
              Sending...
            </span>
          ) : (
            'Send Reset Link'
          )}
        </button>

        <div className="auth-toggle">
          <p>
            Remember your password? <Link to="/login" className="link-button">Back to Login</Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}

export default ForgotPassword;

import { useState, type FormEvent } from 'react';
import { authClient } from '../lib/auth-client';
import { pushLog } from './DebugPanel';

interface SignUpFormProps {
  onSwitch: () => void;
  onSuccess: () => void;
}

export function SignUpForm({ onSwitch, onSuccess }: SignUpFormProps) {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      pushLog('error', 'Validation: passwords do not match');
      setError('Passwords do not match');
      return;
    }
    if (password.length < 8) {
      pushLog('error', 'Validation: password too short');
      setError('Password must be at least 8 characters');
      return;
    }

    setLoading(true);
    pushLog('req', 'POST /api/auth/sign-up/email', {
      name,
      username,
      email,
      password: '***',
    });

    try {
      const { data, error: authError } = await authClient.signUp.email({
        name,
        email,
        password,
        username,
      });

      if (authError) {
        pushLog('error', `Sign-up failed: ${authError.message}`, authError);
        setError(authError.message || 'Sign up failed');
        return;
      }
      if (data) {
        pushLog('res', 'Sign-up successful', data);
        onSuccess();
      }
    } catch (err) {
      pushLog('error', 'Network error during sign-up', {
        message: err instanceof Error ? err.message : String(err),
      });
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="auth-form" onSubmit={handleSubmit}>
      <h1>Create Account</h1>
      <p className="auth-subtitle">Join Frogger today</p>

      {error && (
        <div className="auth-error" role="alert">
          {error}
        </div>
      )}

      <div className="form-group">
        <label htmlFor="name">Full Name</label>
        <input
          id="name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="John Doe"
          required
          autoComplete="name"
        />
      </div>

      <div className="form-group">
        <label htmlFor="username">Username</label>
        <input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="johndoe"
          required
          autoComplete="username"
        />
      </div>

      <div className="form-group">
        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="john@example.com"
          required
          autoComplete="email"
        />
      </div>

      <div className="form-group">
        <label htmlFor="password">Password</label>
        <input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Min. 8 characters"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      <div className="form-group">
        <label htmlFor="confirmPassword">Confirm Password</label>
        <input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="Repeat password"
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>

      <button type="submit" className="auth-btn" disabled={loading}>
        {loading ? 'Creating account...' : 'Sign Up'}
      </button>

      <p className="auth-switch">
        Already have an account?{' '}
        <button type="button" onClick={onSwitch}>
          Sign In
        </button>
      </p>
    </form>
  );
}

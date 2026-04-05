import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signIn } from '../../../lib/auth-client';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Card from '../../../components/ui/Card';
import FrogBackground from '../../../components/FrogBackground';
import '../../../pages/LoginPage.css';

const LoginForm = () => {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    
    const form = new FormData(e.currentTarget);

    try {
      const { error } = await signIn.username({
        username: form.get('username'),
        password: form.get('password'),
      });

      if (error) {
        setError(error.message ?? 'Login failed');
        return;
      }
      navigate('/');
    } catch (err) {
      setError(err.message ?? 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleGitHub = () => {
    signIn.social({ provider: 'github' });
  };

  const handleGoogle = () => {
    signIn.social({ provider: 'google' });
  };

  return (
    <div className="login-page">
      <FrogBackground />
      <div className="login-container">
        <Card title="Welcome back to Frogger" subtitle="Discover and re-discover your interests" className="login-card">
          <form onSubmit={handleLogin} className="login-form">
            <Input
              type="text"
              name="username"
              label="Username"
              placeholder="Enter your username"
              required
            />

            <Input
              type="password"
              name="password"
              label="Password"
              placeholder="Enter your password"
              required
            />

            {error && (
              <div className="alert alert-error">
                {error}
              </div>
            )}
            
            <div className="form-footer">
              <div className="form-actions">
                <Button
                  type="submit"
                  variant="primary"
                  size="large"
                  loading={loading}
                  className="login-button"
                >
                  Sign In
                </Button>
              </div>

              <div className="form-options">
                <p className="text-center">
                  Don't have an account?{' '}
                  <a href="/register" className="link">
                    Sign up
                  </a>
                </p>
                <p className="text-center">
                  <a href="/forgot-password" className="link">
                    Forgot password?
                  </a>
                </p>
              </div>
            </div>
            
            <div className="form-actions">
              <Button
                type="button"
                variant="outline"
                onClick={handleGitHub}
                className="btn btn-medium"
              >
                Sign in with GitHub
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleGoogle}
                className="btn btn-medium"
              >
                Sign in with Google
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
}; 

export default LoginForm;
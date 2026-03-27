import React from 'react';
import { useNavigate } from 'react-router-dom';
import useForm from '../../../hooks/useForm';
import useAuth from '../hooks/useAuth';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Card from '../../../components/ui/Card';

const LoginForm = () => {
  const navigate = useNavigate();
  const { login, loading, error } = useAuth();

  const validate = (values) => {
    const errors = {};

    if (!values.email) {
      errors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(values.email)) {
      errors.email = 'Email is invalid';
    }

    if (!values.password) {
      errors.password = 'Password is required';
    } else if (values.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }

    return errors;
  };

  const {
    values,
    errors,
    touched,
    handleChange,
    handleBlur,
    validateForm,
    resetForm
  } = useForm(
    {
      email: '',
      password: ''
    },
    validate
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await login(values);
      navigate('/profile');
    } catch (err) {
      // Error is already handled by useAuth hook
      console.error('Login failed:', err);
    }
  };

  return (
    <div className="login-container">
      <Card title="Welcome back to Frogger" subtitle="Discover and re-discover your interests" className="login-card">
        <form onSubmit={handleSubmit} className="login-form">
          <Input
            type="email"
            name="email"
            label="Email"
            placeholder="Enter your email"
            value={values.email}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.email && errors.email}
            required
          />

          <Input
            type="password"
            name="password"
            label="Password"
            placeholder="Enter your password"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.password && errors.password}
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
        </form>
      </Card>
    </div>
  );
};

export default LoginForm;

import React from 'react';
import { useNavigate } from 'react-router-dom';
import useForm from '../../../hooks/useForm';
import useAuth from '../hooks/useAuth';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Card from '../../../components/ui/Card';

const SignupForm = () => {
  const navigate = useNavigate();
  const { signup, loading, error } = useAuth();

  const validate = (values) => {
    const errors = {};

    if (!values.name) {
      errors.name = 'Name is required';
    } else if (values.name.length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }

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

    if (!values.confirmPassword) {
      errors.confirmPassword = 'Please confirm your password';
    } else if (values.password !== values.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
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
      name: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    validate
  );

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      await signup(values);
      navigate('/profile');
    } catch (err) {
      console.error('Signup failed:', err);
    }
  };

  return (
    <div className="signup-container">
      <Card title="Join Frogger" subtitle="Create your account to get croaking" className="signup-card">
        <form onSubmit={handleSubmit} className="signup-form">
          <Input
            type="text"
            name="name"
            label="Name"
            placeholder="Enter your name"
            value={values.name}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.name && errors.name}
            required
          />

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
            placeholder="Create a password"
            value={values.password}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.password && errors.password}
            required
          />

          <Input
            type="password"
            name="confirmPassword"
            label="Confirm Password"
            placeholder="Confirm your password"
            value={values.confirmPassword}
            onChange={handleChange}
            onBlur={handleBlur}
            error={touched.confirmPassword && errors.confirmPassword}
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
                className="signup-button"
              >
                Sign Up
              </Button>
            </div>

            <div className="form-options">
              <p className="text-center">
                Already have an account?{' '}
                <a href="/login" className="link">
                  Sign in
                </a>
              </p>
            </div>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default SignupForm;

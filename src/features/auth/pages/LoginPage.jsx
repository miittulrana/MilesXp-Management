// src/features/auth/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import Card from '../../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../../components/common/Card/Card';
import Input from '../../../components/common/Form/Input';
import Button from '../../../components/common/Button/Button';
import Loader from '../../../components/common/Loader/Loader';

/**
 * Login page component
 * @returns {JSX.Element} Login page component
 */
const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, getRememberedEmail } = useAuth();

  // Load remembered email if exists
  useEffect(() => {
    const rememberedEmail = getRememberedEmail();
    if (rememberedEmail) {
      setEmail(rememberedEmail);
      setRemember(true);
    }
  }, [getRememberedEmail]);

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password');
      return;
    }
    
    setError('');
    setIsLoading(true);
    
    try {
      console.log('Attempting login with:', email);
      const { success, error } = await login(email, password, remember);
      
      if (!success && error) {
        setError(error.message || 'Failed to login');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error('Login error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-logo">
          <img src="/assets/logo.png" alt="Fleet Manager" />
        </div>
        
        <Card className="login-card">
          <CardHeader title="Login to Fleet Manager" />
          
          <CardBody>
            <form onSubmit={handleSubmit}>
              {error && <div className="error-message">{error}</div>}
              
              <Input
                name="email"
                type="email"
                label="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                    <polyline points="22,6 12,13 2,6"></polyline>
                  </svg>
                }
              />
              
              <Input
                name="password"
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                icon={
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                  </svg>
                }
              />
              
              <div className="remember-me">
                <label className="checkbox-container">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                  />
                  <span className="checkbox-text">Remember me</span>
                </label>
              </div>
              
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={isLoading}
                disabled={isLoading}
              >
                Login
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
      
      {/* Use regular CSS classes instead of JSX styles */}
    </div>
  );
};

export default LoginPage;
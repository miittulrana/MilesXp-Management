// src/features/auth/LoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../components/common/Card/Card';
import Input from '../../components/common/Form/Input';
import Button from '../../components/common/Button/Button';
import authService from './authService';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const result = await authService.login(email, password);
      
      if (result.success) {
        navigate('/');
      } else {
        setError(result.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Failed to login. Please try again.');
      console.error('Login error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
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
              />
              
              <Input
                name="password"
                type="password"
                label="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
              />
              
              <div className="remember-me">
                <label>
                  <input type="checkbox" /> Remember me
                </label>
              </div>
              
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                disabled={loading}
              >
                Login
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default LoginPage;
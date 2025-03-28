// src/features/auth/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card/Card';
import { CardBody } from '../../components/common/Card/Card';
import Input from '../../components/common/Form/Input';
import Button from '../../components/common/Button/Button';
import { useAuth } from '../../hooks/useAuth';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  
  const navigate = useNavigate();
  const { login, getRememberedEmail } = useAuth();

  // Check for remembered email on component mount
  useEffect(() => {
    const savedEmail = getRememberedEmail();
    if (savedEmail) {
      setEmail(savedEmail);
      setRememberMe(true);
    }
  }, [getRememberedEmail]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      setError('Please enter both email and password');
      return;
    }
    
    try {
      setLoading(true);
      setError('');
      
      const result = await login(email, password, rememberMe);
      
      if (result.success) {
        navigate('/dashboard');
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
    <div className="min-h-screen flex items-center justify-center bg-gray-200 p-4">
      <Card className="w-full max-w-md shadow-lg bg-white">
        <CardBody className="p-8">
          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-md mb-6 text-sm border border-red-100">
              {error}
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="space-y-6">
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
            
            <div className="flex items-center">
              <div className="flex items-center h-5">
                <input 
                  type="checkbox" 
                  id="rememberMe"
                  className="h-4 w-4 border border-gray-300 rounded"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="rememberMe" className="text-gray-600 font-medium">
                  Remember me
                </label>
              </div>
            </div>
            
            <div className="pt-2">
              <Button
                type="submit"
                variant="primary"
                fullWidth
                loading={loading}
                disabled={loading}
                className="py-2.5"
              >
                Login
              </Button>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
};

export default LoginPage;
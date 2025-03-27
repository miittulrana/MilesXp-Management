// src/features/auth/DirectLoginPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card/Card';
import { CardBody, CardHeader } from '../../components/common/Card/Card';
import Button from '../../components/common/Button/Button';
import { ROUTES, ROLES } from '../../lib/constants';

const DirectLoginPage = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleBypassLogin = (role) => {
    setLoading(true);
    
    // Simulate login by storing a mock session in localStorage
    localStorage.setItem('supabase.auth.token', JSON.stringify({
      access_token: 'mock_token',
      expires_at: new Date().getTime() + 3600000,
    }));
    
    // Store user role
    localStorage.setItem('fleet_user_role', role);
    
    // Navigate to dashboard
    setTimeout(() => {
      setLoading(false);
      navigate(ROUTES.DASHBOARD);
      window.location.reload(); // Force reload to reinitialize auth
    }, 1000);
  };

  return (
    <div className="login-page" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
      <div className="login-container">
        <Card className="login-card" style={{ width: '400px', padding: '20px' }}>
          <CardHeader title="Debug Login" />
          <CardBody>
            <div style={{ marginBottom: '20px' }}>
              <h4>Authentication Bypass</h4>
              <p>Use these options to bypass Supabase authentication for testing:</p>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <Button
                variant="primary"
                fullWidth
                loading={loading}
                onClick={() => handleBypassLogin(ROLES.ADMIN)}
              >
                Login as Admin
              </Button>
              
              <Button
                variant="secondary"
                fullWidth
                loading={loading}
                onClick={() => handleBypassLogin(ROLES.DRIVER)}
              >
                Login as Driver
              </Button>
            </div>
            
            <div style={{ marginTop: '20px', padding: '10px', backgroundColor: '#f8f9fa', borderRadius: '4px' }}>
              <h5>Troubleshooting</h5>
              <p>If your app is stuck at authentication, check browser console for errors.</p>
              <p>Verify your Supabase connection settings in .env files.</p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
};

export default DirectLoginPage;
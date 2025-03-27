// src/features/settings/SettingsPage.jsx
import React, { useState, useEffect } from 'react';
import Card from '../../components/common/Card/Card';
import { CardBody, CardHeader, CardFooter } from '../../components/common/Card/Card';
import Input from '../../components/common/Form/Input';
import Select from '../../components/common/Form/Select';
import Button from '../../components/common/Button/Button';
import { useToast } from '../../hooks/useToast';
import supabase from '../../lib/supabase';

const SettingsPage = () => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [settings, setSettings] = useState({
    companyName: '',
    contactEmail: '',
    contactPhone: '',
    maintenanceReminderDays: 30,
    documentExpiryReminderDays: 30,
    dateFormat: 'DD/MM/YYYY',
    timeZone: 'Africa/Nairobi',
    enableNotifications: true,
    emailNotifications: true
  });
  
  useEffect(() => {
    fetchSettings();
  }, []);
  
  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('application_settings')
        .select('*')
        .single();
      
      if (error && error.code !== 'PGRST116') {
        throw error;
      }
      
      if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };
  
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setLoading(true);
      
      // Check if settings record exists
      const { data: existingData, error: checkError } = await supabase
        .from('application_settings')
        .select('id')
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        throw checkError;
      }
      
      let result;
      
      if (existingData?.id) {
        // Update existing settings
        result = await supabase
          .from('application_settings')
          .update(settings)
          .eq('id', existingData.id)
          .select();
      } else {
        // Insert new settings
        result = await supabase
          .from('application_settings')
          .insert(settings)
          .select();
      }
      
      if (result.error) throw result.error;
      
      showSuccess('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      showError('Failed to save settings');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="settings-page">
      <h1>System Settings</h1>
      
      <Card>
        <form onSubmit={handleSubmit}>
          <CardHeader title="General Settings" />
          <CardBody>
            <div className="form-grid">
              <Input 
                label="Company Name"
                name="companyName"
                value={settings.companyName}
                onChange={handleChange}
                required
              />
              
              <Input 
                label="Contact Email"
                name="contactEmail"
                type="email"
                value={settings.contactEmail}
                onChange={handleChange}
                required
              />
              
              <Input 
                label="Contact Phone"
                name="contactPhone"
                value={settings.contactPhone}
                onChange={handleChange}
              />
              
              <Select 
                label="Date Format"
                name="dateFormat"
                value={settings.dateFormat}
                onChange={handleChange}
                options={[
                  { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                  { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                  { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
                ]}
              />
              
              <Input 
                label="Document Expiry Reminder (days)"
                name="documentExpiryReminderDays"
                type="number"
                min="1"
                value={settings.documentExpiryReminderDays}
                onChange={handleChange}
              />
              
              <Input 
                label="Maintenance Reminder (days)"
                name="maintenanceReminderDays"
                type="number"
                min="1"
                value={settings.maintenanceReminderDays}
                onChange={handleChange}
              />
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="enableNotifications"
                    checked={settings.enableNotifications}
                    onChange={handleChange}
                  />
                  Enable Notifications
                </label>
              </div>
              
              <div className="form-group">
                <label>
                  <input
                    type="checkbox"
                    name="emailNotifications"
                    checked={settings.emailNotifications}
                    onChange={handleChange}
                    disabled={!settings.enableNotifications}
                  />
                  Email Notifications
                </label>
              </div>
            </div>
          </CardBody>
          <CardFooter>
            <div className="button-group">
              <Button
                type="button"
                variant="outline"
                onClick={fetchSettings}
                disabled={loading}
              >
                Reset
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={loading}
              >
                Save Settings
              </Button>
            </div>
          </CardFooter>
        </form>
      </Card>
      
      <style jsx>{`
        .settings-page {
          padding: 20px;
        }
        
        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        
        .form-group {
          display: flex;
          align-items: center;
        }
        
        .form-group label {
          display: flex;
          align-items: center;
          gap: 8px;
          cursor: pointer;
        }
        
        .button-group {
          display: flex;
          justify-content: flex-end;
          gap: 10px;
        }
        
        @media (max-width: 768px) {
          .form-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;
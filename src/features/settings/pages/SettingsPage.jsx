import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../hooks/useAuth';
import { useToast } from '../../../hooks/useToast';
import Card, { CardHeader, CardBody, CardFooter } from '../../../components/common/Card/Card';
import Input from '../../../components/common/Form/Input';
import Select from '../../../components/common/Form/Select';
import Button from '../../../components/common/Button/Button';
import supabase from '../../../lib/supabase';
import { TOAST_DURATIONS } from '../../../lib/constants';
import { useForm } from '../../../hooks/useForm';

/**
 * Settings Page component
 * @returns {JSX.Element} Settings page component
 */
const SettingsPage = () => {
  const { userDetails } = useAuth();
  const { showToast, showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [applicationSettings, setApplicationSettings] = useState({});
  const [activeTab, setActiveTab] = useState('general');
  
  // Initialize form with validation
  const { 
    values, 
    errors, 
    handleChange, 
    handleBlur, 
    handleSubmit, 
    setMultipleValues, 
    resetForm 
  } = useForm(
    {
      companyName: '',
      contactEmail: '',
      contactPhone: '',
      maintenanceReminderDays: 30,
      documentExpiryReminderDays: 30,
      nextServiceReminderKm: 1000,
      maxIdleTimeMinutes: 10,
      defaultCurrency: 'KES',
      dateFormat: 'DD/MM/YYYY',
      timeZone: 'Africa/Nairobi',
      enableNotifications: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
      retentionPeriodDays: 180,
      autoBackup: true,
      backupFrequency: 'daily',
      maxUploadSize: 10, // in MB
    },
    validateSettings,
    saveSettings
  );

  // Load settings on component mount
  useEffect(() => {
    fetchSettings();
  }, []);

  /**
   * Validate settings form
   * @param {Object} formValues - Form values to validate
   * @returns {Object} Validation errors
   */
  function validateSettings(formValues) {
    const errors = {};
    
    if (!formValues.companyName?.trim()) {
      errors.companyName = 'Company name is required';
    }
    
    if (!formValues.contactEmail?.trim()) {
      errors.contactEmail = 'Contact email is required';
    } else if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(formValues.contactEmail)) {
      errors.contactEmail = 'Invalid email address';
    }
    
    if (formValues.maintenanceReminderDays < 1) {
      errors.maintenanceReminderDays = 'Must be at least 1 day';
    }
    
    if (formValues.documentExpiryReminderDays < 1) {
      errors.documentExpiryReminderDays = 'Must be at least 1 day';
    }
    
    if (formValues.nextServiceReminderKm < 1) {
      errors.nextServiceReminderKm = 'Must be at least 1 km';
    }
    
    if (formValues.maxIdleTimeMinutes < 1) {
      errors.maxIdleTimeMinutes = 'Must be at least 1 minute';
    }
    
    if (formValues.retentionPeriodDays < 1) {
      errors.retentionPeriodDays = 'Must be at least 1 day';
    }
    
    return errors;
  }

  /**
   * Fetch application settings from database
   */
  const fetchSettings = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('application_settings')
        .select('*')
        .single();
      
      if (error) throw error;
      
      if (data) {
        setApplicationSettings(data);
        setMultipleValues(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      showError('Failed to load settings', TOAST_DURATIONS.MEDIUM);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save application settings to database
   */
  async function saveSettings() {
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
          .update(values)
          .eq('id', existingData.id)
          .select()
          .single();
      } else {
        // Insert new settings
        result = await supabase
          .from('application_settings')
          .insert(values)
          .select()
          .single();
      }
      
      if (result.error) throw result.error;
      
      setApplicationSettings(result.data);
      showSuccess('Settings saved successfully', TOAST_DURATIONS.MEDIUM);
    } catch (error) {
      console.error('Error saving settings:', error);
      showError('Failed to save settings', TOAST_DURATIONS.MEDIUM);
    } finally {
      setLoading(false);
    }
  }

  /**
   * Reset settings to default values
   */
  const handleResetDefaults = () => {
    if (window.confirm('Are you sure you want to reset all settings to default values? This cannot be undone.')) {
      resetForm();
      showToast('Settings reset to default values. Click Save to apply.', 'warning', TOAST_DURATIONS.MEDIUM);
    }
  };

  /**
   * Handle tab change
   * @param {string} tab - Tab name
   */
  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  return (
    <div className="settings-page">
      <h1>System Settings</h1>
      <p className="text-secondary mb-4">
        Configure application settings and preferences. Only administrators can modify these settings.
      </p>

      <div className="settings-container grid grid-cols-4 gap-4">
        {/* Left sidebar with tabs */}
        <div className="settings-sidebar">
          <Card>
            <CardBody>
              <ul className="settings-tabs">
                <li className={activeTab === 'general' ? 'active' : ''}>
                  <button 
                    onClick={() => handleTabChange('general')}
                    className={`settings-tab-button ${activeTab === 'general' ? 'active' : ''}`}
                  >
                    <span className="settings-tab-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="3"></circle>
                        <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path>
                      </svg>
                    </span>
                    <span>General</span>
                  </button>
                </li>
                <li className={activeTab === 'reminders' ? 'active' : ''}>
                  <button 
                    onClick={() => handleTabChange('reminders')}
                    className={`settings-tab-button ${activeTab === 'reminders' ? 'active' : ''}`}
                  >
                    <span className="settings-tab-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path>
                        <path d="M13.73 21a2 2 0 0 1-3.46 0"></path>
                      </svg>
                    </span>
                    <span>Reminders</span>
                  </button>
                </li>
                <li className={activeTab === 'notifications' ? 'active' : ''}>
                  <button 
                    onClick={() => handleTabChange('notifications')}
                    className={`settings-tab-button ${activeTab === 'notifications' ? 'active' : ''}`}
                  >
                    <span className="settings-tab-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M22 17H2a3 3 0 0 0 3-3V9a7 7 0 0 1 14 0v5a3 3 0 0 0 3 3zm-8.27 4a2 2 0 0 1-3.46 0"></path>
                      </svg>
                    </span>
                    <span>Notifications</span>
                  </button>
                </li>
                <li className={activeTab === 'data' ? 'active' : ''}>
                  <button 
                    onClick={() => handleTabChange('data')}
                    className={`settings-tab-button ${activeTab === 'data' ? 'active' : ''}`}
                  >
                    <span className="settings-tab-icon">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
                        <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
                        <line x1="6" y1="6" x2="6.01" y2="6"></line>
                        <line x1="6" y1="18" x2="6.01" y2="18"></line>
                      </svg>
                    </span>
                    <span>Data Management</span>
                  </button>
                </li>
              </ul>
            </CardBody>
          </Card>
        </div>

        {/* Right content panel */}
        <div className="settings-content col-span-3">
          <Card>
            <form onSubmit={handleSubmit}>
              {/* General Settings */}
              {activeTab === 'general' && (
                <>
                  <CardHeader title="General Settings" />
                  <CardBody>
                    <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="Company Name"
                        name="companyName"
                        value={values.companyName || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.companyName}
                        required
                      />
                      
                      <Input 
                        label="Contact Email"
                        name="contactEmail"
                        type="email"
                        value={values.contactEmail || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.contactEmail}
                        required
                      />
                      
                      <Input 
                        label="Contact Phone"
                        name="contactPhone"
                        value={values.contactPhone || ''}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.contactPhone}
                      />
                      
                      <Select 
                        label="Default Currency"
                        name="defaultCurrency"
                        value={values.defaultCurrency || 'KES'}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        options={[
                          { value: 'KES', label: 'Kenyan Shilling (KES)' },
                          { value: 'USD', label: 'US Dollar (USD)' },
                          { value: 'EUR', label: 'Euro (EUR)' },
                          { value: 'GBP', label: 'British Pound (GBP)' }
                        ]}
                      />
                      
                      <Select 
                        label="Date Format"
                        name="dateFormat"
                        value={values.dateFormat || 'DD/MM/YYYY'}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        options={[
                          { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
                          { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' },
                          { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' }
                        ]}
                      />
                      
                      <Select 
                        label="Time Zone"
                        name="timeZone"
                        value={values.timeZone || 'Africa/Nairobi'}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        options={[
                          { value: 'Africa/Nairobi', label: 'East Africa Time (EAT)' },
                          { value: 'UTC', label: 'Coordinated Universal Time (UTC)' },
                          { value: 'Europe/London', label: 'Greenwich Mean Time (GMT)' },
                          { value: 'America/New_York', label: 'Eastern Time (ET)' }
                        ]}
                      />
                    </div>
                  </CardBody>
                </>
              )}

              {/* Reminders Settings */}
              {activeTab === 'reminders' && (
                <>
                  <CardHeader title="Reminders & Alerts Settings" />
                  <CardBody>
                    <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="Maintenance Reminder (days before due)"
                        name="maintenanceReminderDays"
                        type="number"
                        value={values.maintenanceReminderDays || 30}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.maintenanceReminderDays}
                        min={1}
                      />
                      
                      <Input 
                        label="Document Expiry Reminder (days before due)"
                        name="documentExpiryReminderDays"
                        type="number"
                        value={values.documentExpiryReminderDays || 30}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.documentExpiryReminderDays}
                        min={1}
                      />
                      
                      <Input 
                        label="Next Service Reminder (km before due)"
                        name="nextServiceReminderKm"
                        type="number"
                        value={values.nextServiceReminderKm || 1000}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.nextServiceReminderKm}
                        min={1}
                      />
                      
                      <Input 
                        label="Maximum Idle Time (minutes)"
                        name="maxIdleTimeMinutes"
                        type="number"
                        value={values.maxIdleTimeMinutes || 10}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.maxIdleTimeMinutes}
                        min={1}
                      />
                    </div>
                  </CardBody>
                </>
              )}

              {/* Notifications Settings */}
              {activeTab === 'notifications' && (
                <>
                  <CardHeader title="Notification Settings" />
                  <CardBody>
                    <div className="form-group mb-4">
                      <div className="form-switch">
                        <input
                          type="checkbox"
                          id="enableNotifications"
                          name="enableNotifications"
                          checked={values.enableNotifications}
                          onChange={handleChange}
                          className="form-check-input"
                        />
                        <label htmlFor="enableNotifications" className="form-check-label ml-2 font-semibold">
                          Enable All Notifications
                        </label>
                      </div>
                      <div className="form-text">Turn on or off all notification types at once</div>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4 mt-4">
                      <div className="form-group">
                        <div className="form-switch">
                          <input
                            type="checkbox"
                            id="emailNotifications"
                            name="emailNotifications"
                            checked={values.emailNotifications}
                            onChange={handleChange}
                            disabled={!values.enableNotifications}
                            className="form-check-input"
                          />
                          <label htmlFor="emailNotifications" className="form-check-label ml-2">
                            Email Notifications
                          </label>
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <div className="form-switch">
                          <input
                            type="checkbox"
                            id="smsNotifications"
                            name="smsNotifications"
                            checked={values.smsNotifications}
                            onChange={handleChange}
                            disabled={!values.enableNotifications}
                            className="form-check-input"
                          />
                          <label htmlFor="smsNotifications" className="form-check-label ml-2">
                            SMS Notifications
                          </label>
                        </div>
                      </div>
                      
                      <div className="form-group">
                        <div className="form-switch">
                          <input
                            type="checkbox"
                            id="pushNotifications"
                            name="pushNotifications"
                            checked={values.pushNotifications}
                            onChange={handleChange}
                            disabled={!values.enableNotifications}
                            className="form-check-input"
                          />
                          <label htmlFor="pushNotifications" className="form-check-label ml-2">
                            In-App Push Notifications
                          </label>
                        </div>
                      </div>
                    </div>
                  </CardBody>
                </>
              )}

              {/* Data Management Settings */}
              {activeTab === 'data' && (
                <>
                  <CardHeader title="Data Management Settings" />
                  <CardBody>
                    <div className="grid grid-cols-2 gap-4">
                      <Input 
                        label="Data Retention Period (days)"
                        name="retentionPeriodDays"
                        type="number"
                        value={values.retentionPeriodDays || 180}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.retentionPeriodDays}
                        min={1}
                      />
                      
                      <Input 
                        label="Maximum Upload Size (MB)"
                        name="maxUploadSize"
                        type="number"
                        value={values.maxUploadSize || 10}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={errors.maxUploadSize}
                        min={1}
                      />
                      
                      <div className="form-group col-span-2">
                        <div className="form-switch">
                          <input
                            type="checkbox"
                            id="autoBackup"
                            name="autoBackup"
                            checked={values.autoBackup}
                            onChange={handleChange}
                            className="form-check-input"
                          />
                          <label htmlFor="autoBackup" className="form-check-label ml-2 font-semibold">
                            Automatic Backup
                          </label>
                        </div>
                        <div className="form-text">Enable automatic database backups</div>
                      </div>
                      
                      <Select 
                        label="Backup Frequency"
                        name="backupFrequency"
                        value={values.backupFrequency || 'daily'}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        disabled={!values.autoBackup}
                        options={[
                          { value: 'daily', label: 'Daily' },
                          { value: 'weekly', label: 'Weekly' },
                          { value: 'monthly', label: 'Monthly' }
                        ]}
                      />
                    </div>
                    
                    <div className="mt-6 p-4 bg-warning bg-opacity-10 rounded">
                      <h4 className="text-warning mb-2">Danger Zone</h4>
                      <p className="mb-4">These actions are irreversible. Please proceed with caution.</p>
                      
                      <div className="flex gap-4">
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to purge all logs older than the retention period? This action cannot be undone.')) {
                              showToast('This functionality is not implemented in the demo.', 'info');
                            }
                          }}
                        >
                          Purge Old Logs
                        </Button>
                        
                        <Button
                          type="button"
                          variant="danger"
                          onClick={() => {
                            if (window.confirm('Are you sure you want to export all system data? This may take some time.')) {
                              showToast('This functionality is not implemented in the demo.', 'info');
                            }
                          }}
                        >
                          Export All Data
                        </Button>
                      </div>
                    </div>
                  </CardBody>
                </>
              )}

              <CardFooter>
                <div className="flex justify-between">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleResetDefaults}
                  >
                    Reset to Defaults
                  </Button>
                  
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => fetchSettings()}
                    >
                      Cancel
                    </Button>
                    
                    <Button
                      type="submit"
                      variant="primary"
                      loading={loading}
                    >
                      Save Settings
                    </Button>
                  </div>
                </div>
              </CardFooter>
            </form>
          </Card>
        </div>
      </div>

      <style jsx>{`
        .settings-tabs {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .settings-tabs li {
          margin-bottom: 0.5rem;
        }
        
        .settings-tab-button {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 0.75rem 1rem;
          border: none;
          border-radius: var(--border-radius-md);
          background: transparent;
          text-align: left;
          transition: all var(--transition-fast) ease;
        }
        
        .settings-tab-button:hover {
          background-color: var(--surface-color);
        }
        
        .settings-tab-button.active {
          background-color: var(--primary-color);
          color: white;
        }
        
        .settings-tab-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          margin-right: 0.75rem;
          width: 24px;
          height: 24px;
        }
        
        .settings-tab-icon svg {
          width: 18px;
          height: 18px;
        }
        
        .form-switch {
          display: flex;
          align-items: center;
        }
        
        .form-check-input {
          width: 2rem;
          height: 1rem;
          margin-right: 0.5rem;
        }
      `}</style>
    </div>
  );
};

export default SettingsPage;
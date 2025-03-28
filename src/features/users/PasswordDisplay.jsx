import React from 'react';
import PropTypes from 'prop-types';
import Button from '../../components/common/Button/Button';

/**
 * Component to display generated password
 */
const PasswordDisplay = ({ password, userName, onCopy }) => {
  return (
    <div className="p-4 text-center">
      <div className="mb-4">
        <h3 className="text-xl font-semibold text-primary mb-2">New Password Generated</h3>
        <p>Password for <strong>{userName}</strong> has been generated:</p>
      </div>
      
      <div className="bg-surface-color border border-border-color rounded-md p-3 my-4 font-mono text-lg break-all font-semibold">
        {password}
      </div>
      
      <p className="text-sm text-text-secondary mb-4">
        This password will only be shown once. Please save it or share it with the user.
      </p>
      
      <Button 
        variant="primary" 
        onClick={onCopy}
        fullWidth
      >
        Copy to Clipboard
      </Button>
    </div>
  );
};

PasswordDisplay.propTypes = {
  password: PropTypes.string.isRequired,
  userName: PropTypes.string,
  onCopy: PropTypes.func.isRequired
};

export default PasswordDisplay;
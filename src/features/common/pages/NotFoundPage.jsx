import React from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../lib/constants';
import Button from '../../../components/common/Button/Button';

/**
 * Not Found Page component
 * @returns {JSX.Element} Not found page component
 */
const NotFoundPage = () => {
  return (
    <div className="not-found-page">
      <div className="not-found-content">
        <div className="not-found-code">404</div>
        <h1 className="not-found-title">Page Not Found</h1>
        <p className="not-found-message">
          Sorry, the page you are looking for doesn't exist or has been moved.
        </p>
        <div className="not-found-actions">
          <Link to={ROUTES.DASHBOARD}>
            <Button>
              <svg xmlns="http://www.w3.org/2000/svg" className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                <polyline points="9 22 9 12 15 12 15 22"></polyline>
              </svg>
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
      
      <style jsx>{`
        .not-found-page {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 80vh;
          padding: 2rem;
          text-align: center;
        }
        
        .not-found-content {
          max-width: 500px;
          margin: 0 auto;
        }
        
        .not-found-code {
          font-size: 6rem;
          font-weight: 700;
          color: var(--primary-color);
          line-height: 1;
          margin-bottom: 1rem;
        }
        
        .not-found-title {
          font-size: 2rem;
          font-weight: 600;
          margin-bottom: 1rem;
        }
        
        .not-found-message {
          color: var(--text-secondary);
          margin-bottom: 2rem;
        }
        
        .not-found-actions {
          display: flex;
          justify-content: center;
        }
      `}</style>
    </div>
  );
};

export default NotFoundPage;
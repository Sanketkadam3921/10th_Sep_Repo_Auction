import React from 'react';
import { Gavel } from 'lucide-react';
import './LoadingSpinner.css';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="ap-loading-spinner" role="status" aria-live="polite" aria-label="Loading">
      <div className="ap-loading-logo">
        <div className="ap-loading-logo-block" />
        <div className="ap-loading-logo-hammer">
          <Gavel className="ap-loading-logo-icon" />
        </div>
        <div className="ap-loading-logo-ring" />
      </div>
      <p className="ap-loading-text">Preparing dashboard…</p>
    </div>
  );
};

export default LoadingSpinner;

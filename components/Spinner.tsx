// components/Spinner.tsx
import React from 'react';

const Spinner = () => (
    <div className="spinner-container">
        <div className="spinner"></div>
        <style jsx>{`
      .spinner-container {
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100%;
        width: 100%;
      }
      
      .spinner {
        width: 50px;
        height: 50px;
        border: 5px solid rgba(0, 0, 0, 0.1);
        border-radius: 50%;
        //border-left-color: #007bff;
        border-left-color: #22c55e;
        animation: spin 1s linear infinite;
      }

      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
    </div>
);

export default Spinner;

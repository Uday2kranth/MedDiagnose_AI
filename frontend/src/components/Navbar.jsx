import React from 'react';
import { motion } from 'framer-motion';

const Navbar = ({ isModelReady, backendOnline }) => {
  return (
    <nav className="navbar" id="main-nav" style={{ background: 'transparent', borderBottom: 'none' }}>
      <div className="navbar-inner" style={{ padding: '14px 0', display: 'flex', justifyContent: 'flex-end', width: '100%' }}>
        <div className="navbar-right" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Server Connection Status Badge */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', damping: 20 }}
          >
            <span className="badge" style={{
              background: backendOnline === true 
                ? 'rgba(110, 231, 183, 0.08)' 
                : backendOnline === false 
                  ? 'rgba(239, 68, 68, 0.08)' 
                  : 'rgba(251, 191, 36, 0.08)',
              color: backendOnline === true 
                ? '#34d399' 
                : backendOnline === false 
                  ? '#f87171' 
                  : '#fbbf24',
              border: backendOnline === true 
                ? '1px solid rgba(110, 231, 183, 0.15)' 
                : backendOnline === false 
                  ? '1px solid rgba(239, 68, 68, 0.15)' 
                  : '1px solid rgba(251, 191, 36, 0.15)',
              marginRight: '8px'
            }}>
              <span 
                className="result-live-dot" 
                style={{ 
                  width: 6, 
                  height: 6, 
                  background: backendOnline === true 
                    ? '#34d399' 
                    : backendOnline === false 
                      ? '#f87171' 
                      : '#fbbf24',
                  boxShadow: backendOnline === true 
                    ? '0 0 8px #34d399' 
                    : backendOnline === false 
                      ? '0 0 8px #f87171' 
                      : '0 0 8px #fbbf24'
                }} 
              />
              {backendOnline === true 
                ? 'Server: Online' 
                : backendOnline === false 
                  ? 'Server: Offline' 
                  : 'Server: Connecting...'}
            </span>
          </motion.div>

          {isModelReady && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ type: 'spring', damping: 20, delay: 0.1 }}
            >
              <span className="badge badge-live">
                <span className="result-live-dot" style={{ width: 6, height: 6 }} />
                Live
              </span>
            </motion.div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;


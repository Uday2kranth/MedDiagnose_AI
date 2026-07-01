import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Loader2, CheckCircle } from 'lucide-react';

const UploadScreen = ({
  loadingUpload,
  uploadSuccess,
  isDragging,
  onDragOver,
  onDragLeave,
  onDrop,
  onFileSelect,
}) => {
  return (
    <motion.div
      key="upload-screen"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(12px)' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="upload-screen"
      id="upload-screen"
    >
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <motion.h2
          className="upload-hero-title"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1, duration: 0.6 }}
        >
          <span className="text-gradient-warm">Precision</span>{' '}
          <span className="text-gradient">Insights.</span>
        </motion.h2>
        <motion.p
          className="upload-hero-subtitle"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.6 }}
        >
          Upload any medical dataset to initialize the interactive inference dashboard
          with AI-powered diagnostics and explainability.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <div
          className={`upload-zone ${isDragging ? 'dragging' : ''}`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
        >
          <label className="upload-zone-inner" id="upload-zone">
            <AnimatePresence mode="wait">
              {loadingUpload ? (
                <motion.div
                  key="loading"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', damping: 20 }}
                  className="upload-loader"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Loader2 />
                  </motion.div>
                  <span className="upload-loader-text">Training Model...</span>
                </motion.div>
              ) : uploadSuccess ? (
                <motion.div
                  key="success"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', damping: 15, stiffness: 200 }}
                  className="upload-success"
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <CheckCircle />
                  <span className="upload-success-text">Model Ready</span>
                </motion.div>
              ) : (
                <motion.div
                  key="idle"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.9, opacity: 0 }}
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}
                >
                  <div className="upload-icon-wrapper">
                    <motion.div
                      animate={{ y: [0, -10, 0] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <UploadCloud />
                    </motion.div>
                    <div className="upload-pulse-ring" />
                  </div>
                  <span className="upload-title">
                    {isDragging ? '✦ Drop to analyze!' : 'Drag & Drop Data'}
                  </span>
                  <span className="upload-hint" style={{ color: '#ff8a8a', fontWeight: '500', display: 'block', margin: '8px 0 4px 0' }}>
                    ⚠️ Only clean & preprocessed datasets accepted
                  </span>
                  <span className="upload-hint-sub" style={{ fontSize: '0.8rem', opacity: 0.8, display: 'block', maxWidth: '300px', lineHeight: '1.3' }}>
                    Datasets with missing values, duplicate rows, or empty/unstandardized columns will not be accepted.
                  </span>
                </motion.div>
              )}
            </AnimatePresence>
            <input
              type="file"
              className="upload-file-input"
              accept=".csv"
              onChange={(e) => onFileSelect(e.target.files[0])}
              disabled={loadingUpload || uploadSuccess}
              id="file-upload-input"
            />
          </label>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default UploadScreen;

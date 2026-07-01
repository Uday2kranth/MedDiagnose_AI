import React from 'react';
import { motion } from 'framer-motion';
import { HeartPulse, Sparkles } from 'lucide-react';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const fieldItem = {
  hidden: { opacity: 0, x: -15 },
  show: {
    opacity: 1,
    x: 0,
    transition: { type: 'spring', damping: 25, stiffness: 250 },
  },
};

const PatientForm = ({ features, predictData, onFieldChange, onLoadSample }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: -30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 180, delay: 0.2 }}
      className="patient-form-card glass-card"
      id="patient-form"
    >
      <div className="patient-form-header">
        <HeartPulse />
        <h3>Patient Metrics</h3>
      </div>

      {/* Sample data button */}
      <motion.button
        className="sample-btn"
        onClick={onLoadSample}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
      >
        <Sparkles />
        Load Sample Patient
      </motion.button>

      <div className="patient-form-scroll hide-scrollbar">
        <motion.div
          className="patient-form-fields"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {features.map((feat) => (
            <motion.div key={feat} className="form-group" variants={fieldItem}>
              <label className="label" htmlFor={`field-${feat}`}>
                {feat.replace(/_/g, ' ')}
              </label>
              <input
                id={`field-${feat}`}
                type="number"
                className="input-field"
                value={predictData[feat] !== undefined ? predictData[feat] : ''}
                onChange={(e) => onFieldChange(feat, parseFloat(e.target.value) || 0)}
                placeholder="0"
              />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </motion.div>
  );
};

export default PatientForm;

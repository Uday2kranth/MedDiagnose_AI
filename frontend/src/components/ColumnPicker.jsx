import React from 'react';
import { motion } from 'framer-motion';
import { Database, ChevronRight } from 'lucide-react';

const ColumnPicker = ({ columns, selectedTarget, onTargetChange, onConfirm, dataPreview, rowCount }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, filter: 'blur(12px)' }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="column-picker"
      id="column-picker"
    >
      <motion.div
        className="column-picker-card glass-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.5 }}
      >
        <div className="column-picker-header">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', damping: 15, delay: 0.2 }}
            style={{
              width: 56, height: 56, borderRadius: 16, margin: '0 auto var(--space-lg)',
              background: 'linear-gradient(135deg, var(--accent-peach-10), var(--accent-lilac-10))',
              border: '1px solid var(--accent-lilac-20)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}
          >
            <Database style={{ width: 28, height: 28, color: 'var(--accent-lilac)' }} />
          </motion.div>
          <h2 className="text-gradient">Configure Target</h2>
          <p>Select the column your model should predict. Detected <strong style={{color: 'var(--accent-peach)'}}>{rowCount}</strong> rows and <strong style={{color: 'var(--accent-peach)'}}>{columns.length}</strong> columns.</p>
        </div>

        <label className="label" htmlFor="target-select">Target (Output) Column</label>
        <select
          id="target-select"
          className="column-picker-select"
          value={selectedTarget}
          onChange={(e) => onTargetChange(e.target.value)}
        >
          {columns.map(col => (
            <option key={col} value={col}>{col}</option>
          ))}
        </select>

        {dataPreview && dataPreview.length > 0 && (
          <div className="column-picker-preview">
            <div style={{marginBottom: 6, color: 'var(--text-muted)', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em'}}>
              Preview (first 3 rows)
            </div>
            {dataPreview.map((row, i) => (
              <div key={i} style={{marginBottom: 4}}>
                {Object.entries(row).map(([k, v]) => (
                  <span key={k} style={{marginRight: 12}}>
                    <span style={{color: 'var(--text-muted)'}}>{k}:</span>{' '}
                    <span style={{color: k === selectedTarget ? 'var(--accent-peach)' : 'var(--text-secondary)'}}>{v}</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        )}

        <motion.button
          className="column-picker-btn"
          onClick={onConfirm}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.97 }}
          id="train-btn"
        >
          Train Model <ChevronRight style={{width: 18, height: 18}} />
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

export default ColumnPicker;

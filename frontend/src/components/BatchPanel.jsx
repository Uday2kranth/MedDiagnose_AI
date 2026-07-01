import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Play, CheckCircle, BarChart3, AlertCircle, Info } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function BatchPanel({ batchData, metrics, taskType, onReset }) {
  const [loading, setLoading] = useState(false);
  const [predictions, setPredictions] = useState(null);
  const [error, setError] = useState(null);

  const handleRunBatch = async () => {
    if (!batchData || batchData.length === 0) return;
    setLoading(true);
    setError(null);
    try {
      // Extract only feature columns from the records to predict on
      const featureCols = Object.keys(batchData[0]).filter(k => k !== "Outcome" && k !== "target");
      const recordsToPredict = batchData.map(row => {
        const record = {};
        featureCols.forEach(col => {
          record[col] = row[col];
        });
        return record;
      });

      const res = await axios.post(`${API_URL}/predict-batch`, recordsToPredict);
      if (res.data && res.data.predictions) {
        setPredictions(res.data.predictions);
      } else {
        setError("Invalid batch prediction response.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Batch prediction request failed.");
    }
    setLoading(false);
  };

  if (!batchData || batchData.length === 0) {
    return (
      <div className="glass-card" style={{ padding: '40px', borderRadius: '20px', textAlign: 'center' }}>
        <Database size={48} style={{ color: 'var(--text-muted)', marginBottom: '16px' }} />
        <h3 style={{ fontSize: '1.25rem', color: '#fff', marginBottom: '8px' }}>No Batch Data Preloaded</h3>
        <p style={{ color: 'var(--text-muted)', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
          Please go to the Welcome tab and click <strong>"Load Sample Dataset"</strong> or upload a file first to execute batch predictions.
        </p>
      </div>
    );
  }

  // Feature columns
  const firstRow = batchData[0];
  const columns = Object.keys(firstRow);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="batch-panel"
    >
      {/* Header card */}
      <div className="glass-card batch-header-card" style={{ padding: '24px', borderRadius: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              background: 'linear-gradient(135deg, rgba(251, 191, 36, 0.15), rgba(245, 158, 11, 0.1))',
              padding: '10px',
              borderRadius: '12px',
              border: '1px solid rgba(251, 191, 36, 0.2)',
              color: 'var(--accent-gold)'
            }}>
              <Database size={20} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
                Batch Analysis Console
              </h2>
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
                Loaded array containing <strong>{batchData.length}</strong> realistic records mapped automatically.
              </p>
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            {onReset && (
              <button
                onClick={onReset}
                className="btn-secondary"
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  color: '#f87171',
                  border: '1px solid rgba(239, 68, 68, 0.2)',
                  borderRadius: '12px',
                  padding: '10px 18px',
                  fontSize: '13px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                Reset Session
              </button>
            )}
            <button
              onClick={handleRunBatch}
              disabled={loading}
              className="batch-run-btn"
            >
              {loading ? (
                <>
                  <div className="spinner-mini" /> Evaluating Batch...
                </>
              ) : (
                <>
                  <Play size={16} fill="currentColor" /> Run Batch Inference
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.08)',
            border: '1px solid rgba(255, 107, 107, 0.15)',
            padding: '12px',
            borderRadius: '12px',
            marginTop: '16px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            color: 'var(--accent-coral)'
          }}>
            <AlertCircle size={16} />
            <span style={{ fontSize: '0.85rem' }}>{error}</span>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px' }}>
        {/* Predictions Results */}
        <AnimatePresence>
          {predictions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-card"
              style={{ padding: '24px', borderRadius: '20px' }}
            >
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <CheckCircle size={18} style={{ color: '#34d399' }} /> Evaluation Results
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                <div className="batch-stat-subcard">
                  <span className="batch-stat-lbl">Evaluation Count</span>
                  <span className="batch-stat-val">{predictions.length} Patients</span>
                </div>
                <div className="batch-stat-subcard">
                  <span className="batch-stat-lbl">Model Type</span>
                  <span className="batch-stat-val" style={{ textTransform: 'capitalize' }}>{taskType}</span>
                </div>
                {taskType === 'classification' && (
                  <div className="batch-stat-subcard">
                    <span className="batch-stat-lbl">Avg Confidence</span>
                    <span className="batch-stat-val">
                      {(predictions.reduce((acc, curr) => acc + curr.confidence, 0) / predictions.length).toFixed(1)}%
                    </span>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dataset Table View */}
        <div className="glass-card" style={{ borderRadius: '20px', overflow: 'hidden' }}>
          <div style={{ padding: '18px 24px', borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <BarChart3 size={16} style={{ color: 'var(--accent-lilac)' }} />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-bright)' }}>Data Preview Matrix</span>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="batch-table">
              <thead>
                <tr>
                  <th style={{ width: '50px', textAlign: 'center' }}>ID</th>
                  {predictions && <th style={{ color: 'var(--accent-mint)' }}>Prediction</th>}
                  {predictions && taskType === 'classification' && <th style={{ color: 'var(--accent-mint)' }}>Confidence</th>}
                  {columns.map(col => (
                    <th key={col}>{col}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {batchData.map((row, idx) => (
                  <tr key={idx} className={predictions ? 'predicted-row' : ''}>
                    <td style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--text-muted)' }}>{idx + 1}</td>
                    {predictions && (
                      <td style={{ fontWeight: 'bold', color: predictions[idx].prediction === "1" || predictions[idx].prediction === "diabetic" || predictions[idx].prediction === "positive" ? 'var(--accent-coral)' : 'var(--accent-mint)' }}>
                        {predictions[idx].prediction}
                      </td>
                    )}
                    {predictions && taskType === 'classification' && (
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '12px' }}>
                        {predictions[idx].confidence.toFixed(1)}%
                      </td>
                    )}
                    {columns.map(col => (
                      <td key={col} style={{ fontFamily: typeof row[col] === 'number' ? 'var(--font-mono)' : 'inherit' }}>
                        {typeof row[col] === 'number' ? row[col].toFixed(1).replace('.0', '') : String(row[col])}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

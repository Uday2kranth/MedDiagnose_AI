import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import SkeletonLoader from './SkeletonLoader';

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-name">{payload[0].payload.name}</p>
        <p className="chart-tooltip-value">Impact: {payload[0].value.toFixed(4)}</p>
      </div>
    );
  }
  return null;
};

const ResultPanel = ({ result, isInferencing, taskType = 'classification' }) => {
  const circumference = 2 * Math.PI * 23;
  const isRegression = taskType === 'regression';

  // Dynamic color based on confidence (classification only)
  const getConfidenceColor = (conf) => {
    if (conf >= 70) return 'var(--accent-mint)';
    if (conf >= 40) return 'var(--accent-gold)';
    return 'var(--accent-coral)';
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 180, delay: 0.3 }}
      className="result-panel-card glass-card"
      id="result-panel"
    >
      <AnimatePresence>
        {isInferencing && <SkeletonLoader key="skeleton" />}
      </AnimatePresence>

      {result && !isInferencing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          style={{ display: 'flex', flexDirection: 'column', flex: 1, position: 'relative', zIndex: 1 }}
        >
          {/* Header */}
          <div className="result-header">
            <div>
              <div className="result-diagnosis-label">
                <span className="result-live-dot" />
                <span className="result-diagnosis-sublabel">
                  {isRegression ? 'Live Prediction' : 'Live Diagnosis'}
                </span>
              </div>
              <motion.h2
                className="result-prediction"
                key={String(result.prediction)}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: 'spring', damping: 20 }}
              >
                {isRegression
                  ? (typeof result.prediction === 'number' ? result.prediction.toFixed(4) : result.prediction)
                  : result.prediction
                }
              </motion.h2>
            </div>

            {/* Classification: confidence ring | Regression: error metrics */}
            {isRegression ? (
              <div className="result-confidence-section" style={{ textAlign: 'right' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div>
                    <p style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 2 }}>R² Score</p>
                    <motion.span
                      style={{ fontSize: 22, fontWeight: 700, fontFamily: 'var(--font-mono)', color: 'var(--accent-peach)' }}
                      key={result.r2}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                    >
                      {(result.r2 * 100).toFixed(1)}%
                    </motion.span>
                  </div>
                  <div style={{ display: 'flex', gap: 16 }}>
                    <div>
                      <p style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>MAE</p>
                      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--accent-lilac)' }}>
                        {(result.mae || 0).toFixed(3)}
                      </span>
                    </div>
                    <div>
                      <p style={{ fontSize: 9, color: 'var(--text-muted)', textTransform: 'uppercase' }}>RMSE</p>
                      <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--accent-mint)' }}>
                        {(result.rmse || 0).toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="result-confidence-section">
                <p className="result-confidence-label">Confidence Level</p>
                <div className="confidence-ring-wrapper">
                  <motion.span
                    className="result-confidence-value"
                    style={{ color: getConfidenceColor(result.confidence) }}
                    key={result.confidence}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ type: 'spring', damping: 15 }}
                  >
                    {result.confidence.toFixed(1)}%
                  </motion.span>
                  <div className="confidence-ring">
                    <svg viewBox="0 0 56 56">
                      <circle cx="28" cy="28" r="23" className="confidence-ring-bg" />
                      <motion.circle
                        cx="28" cy="28" r="23"
                        className="confidence-ring-fill"
                        style={{
                          stroke: getConfidenceColor(result.confidence),
                          filter: `drop-shadow(0 0 6px ${getConfidenceColor(result.confidence)})`,
                        }}
                        strokeDasharray={circumference}
                        initial={{ strokeDashoffset: circumference }}
                        animate={{ strokeDashoffset: circumference - (circumference * result.confidence) / 100 }}
                        transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                      />
                    </svg>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* SHAP Chart */}
          <div className="shap-section">
            <div className="shap-header">
              <Activity />
              <h3>SHAP Explainability</h3>
            </div>
            <div className="shap-chart">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={result.shap_impact}
                  layout="vertical"
                  margin={{ top: 0, right: 5, left: 10, bottom: 0 }}
                  animationDuration={900}
                  animationEasing="ease-out"
                >
                  <XAxis type="number" hide />
                  <YAxis
                    dataKey="name"
                    type="category"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#8b83a8', fontSize: 11, fontWeight: 600, fontFamily: 'var(--font-mono)' }}
                    width={90}
                  />
                  <Tooltip
                    cursor={{ fill: 'rgba(255,255,255,0.02)' }}
                    content={<CustomTooltip />}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                    {result.shap_impact.map((entry, idx) => (
                      <Cell
                        key={`cell-${idx}`}
                        fill={entry.value > 0 ? '#ff6b9d' : '#7dd3fc'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* Empty state */}
      {!result && !isInferencing && (
        <div className="result-empty">
          <motion.div
            animate={{ opacity: [0.2, 0.5, 0.2] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Activity />
          </motion.div>
          <p>Input patient data or load a sample...</p>
        </div>
      )}
    </motion.div>
  );
};

export default ResultPanel;

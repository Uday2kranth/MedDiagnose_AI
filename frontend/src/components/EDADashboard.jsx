import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart3, ChevronDown, ChevronUp, Info } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function EDADashboard({ isModelReady }) {
  const [isOpen, setIsOpen] = useState(true);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isModelReady) return;
    
    const fetchEDA = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get(`${API_URL}/eda`);
        setData(res.data);
      } catch (err) {
        console.error("Failed to load EDA reports:", err);
        setError("Unable to retrieve EDA visualizations. Make sure the backend is running.");
      }
      setLoading(false);
    };

    fetchEDA();
  }, [isModelReady]);

  if (!isModelReady) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 180, delay: 0.45 }}
      className="glass-card"
      style={{
        marginTop: '30px',
        padding: '24px',
        borderRadius: '20px',
        background: 'linear-gradient(165deg, rgba(255,255,255,0.035) 0%, rgba(255,255,255,0.005) 100%)',
        border: '1px solid rgba(255,255,255,0.05)',
        boxShadow: 'var(--shadow-md)',
        overflow: 'hidden'
      }}
    >
      {/* Header */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(80, 227, 194, 0.1))',
            padding: '10px',
            borderRadius: '12px',
            border: '1px solid rgba(139, 92, 246, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-mint)'
          }}>
            <BarChart3 size={20} />
          </div>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0, color: '#f8fafc' }}>
              EDA Visualizations
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0' }}>
              Python-generated data distribution plots and Pearson correlation matrix heatmap.
            </p>
          </div>
        </div>
        <div style={{ color: 'var(--text-muted)' }}>
          {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
      </div>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '20px' }}>
              
              {loading && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '40px 0', gap: '16px' }}>
                  <div className="spinner" style={{ width: '32px', height: '32px', border: '3px solid rgba(255,255,255,0.1)', borderTopColor: 'var(--accent-lilac)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Generating EDA visualizations...</p>
                </div>
              )}

              {error && (
                <div style={{ background: 'rgba(255, 107, 107, 0.08)', border: '1px solid rgba(255, 107, 107, 0.15)', padding: '12px 18px', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--accent-coral)' }}>
                  <Info size={16} />
                  <span style={{ fontSize: '0.85rem' }}>{error}</span>
                </div>
              )}

              {data && !loading && (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '40px',
                  alignItems: 'center',
                  marginTop: '10px'
                }}>
                  {/* 1. First Feature Distribution */}
                  {data.plots.plot_dist1 && (
                    <div style={{ 
                      background: 'rgba(255,255,255,0.015)', 
                      border: '1px solid rgba(255,255,255,0.04)', 
                      borderRadius: '16px', 
                      padding: '20px', 
                      width: '100%',
                      maxWidth: '720px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                    }}>
                      <img 
                        src={`data:image/png;base64,${data.plots.plot_dist1}`} 
                        alt="Feature 1 distribution" 
                        style={{ width: '100%', height: 'auto', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
                      />
                      <div style={{
                        marginTop: '16px',
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'rgba(0, 212, 255, 0.03)',
                        border: '1px solid rgba(0, 212, 255, 0.1)',
                        textAlign: 'left'
                      }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#00d4ff', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Info size={14} /> Understanding Feature Density & Spread
                        </h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                          This histogram represents the probability density and count of patient measurements for your primary clinical feature. 
                          The colored cohorts show the overlap between outcome categories. 
                          <strong>Clinical Value:</strong> If positive cases (red) cluster heavily in higher ranges while negative cases (blue) reside in lower ranges, it indicates a high diagnostic correlation and suggests a sharp numerical cut-off for patient screening.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 2. Second Feature Distribution */}
                  {data.plots.plot_dist2 && (
                    <div style={{ 
                      background: 'rgba(255,255,255,0.015)', 
                      border: '1px solid rgba(255,255,255,0.04)', 
                      borderRadius: '16px', 
                      padding: '20px', 
                      width: '100%',
                      maxWidth: '720px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                    }}>
                      <img 
                        src={`data:image/png;base64,${data.plots.plot_dist2}`} 
                        alt="Feature 2 distribution" 
                        style={{ width: '100%', height: 'auto', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
                      />
                      <div style={{
                        marginTop: '16px',
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'rgba(16, 185, 129, 0.03)',
                        border: '1px solid rgba(16, 185, 129, 0.1)',
                        textAlign: 'left'
                      }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#10b981', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Info size={14} /> Secondary Clinical Attribute Spread
                        </h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                          This histogram maps the distribution of the second most continuous feature. By looking at the peak height and overlap of the outcome groups, you can perceive the dispersion shape.
                          <strong>Clinical Value:</strong> It reveals if the feature is normally distributed or highly skewed. Highly skewed features can influence model training, which alerts data scientists to apply scaling transforms.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 3. Pearson Correlation Heatmap */}
                  {data.plots.plot_corr && (
                    <div style={{ 
                      background: 'rgba(255,255,255,0.015)', 
                      border: '1px solid rgba(255,255,255,0.04)', 
                      borderRadius: '16px', 
                      padding: '20px', 
                      width: '100%',
                      maxWidth: '720px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                    }}>
                      <img 
                        src={`data:image/png;base64,${data.plots.plot_corr}`} 
                        alt="Correlation matrix" 
                        style={{ width: '100%', height: 'auto', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
                      />
                      <div style={{
                        marginTop: '16px',
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'rgba(139, 92, 246, 0.03)',
                        border: '1px solid rgba(139, 92, 246, 0.1)',
                        textAlign: 'left'
                      }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#a78bfa', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Info size={14} /> Pearson Correlation Coefficient Heatmap
                        </h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                          This matrix plots linear correlations between variables. Colors range from deep red (+1, strong positive correlation) to deep blue (-1, strong negative correlation), with dark/black representing near-zero correlation.
                          <strong>Data Science Value:</strong> It prevents redundant features (multicollinearity) from overfitting your models. It also explicitly shows which patient features (e.g. Glucose) have the strongest raw linear association with the target diagnosis.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 4. Target Class Balance (NEW) */}
                  {data.plots.plot_class_balance && (
                    <div style={{ 
                      background: 'rgba(255,255,255,0.015)', 
                      border: '1px solid rgba(255,255,255,0.04)', 
                      borderRadius: '16px', 
                      padding: '20px', 
                      width: '100%',
                      maxWidth: '720px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                    }}>
                      <img 
                        src={`data:image/png;base64,${data.plots.plot_class_balance}`} 
                        alt="Target class balance" 
                        style={{ width: '100%', height: 'auto', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
                      />
                      <div style={{
                        marginTop: '16px',
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'rgba(245, 158, 11, 0.03)',
                        border: '1px solid rgba(245, 158, 11, 0.1)',
                        textAlign: 'left'
                      }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#f59e0b', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Info size={14} /> Outcome Target Class Representation
                        </h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                          This bar chart compares the total count of patients in each outcome class (e.g. diabetic vs healthy, or 1 vs 0). 
                          <strong>Academic & Ethical Value:</strong> Balanced training is critical for medical AI. A highly unbalanced dataset (e.g. 95% healthy and only 5% positive) will lead to an inaccurate model that fails to detect actual disease, making this class balance audit essential.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* 5. Feature Boxplot (NEW) */}
                  {data.plots.plot_boxplot && (
                    <div style={{ 
                      background: 'rgba(255,255,255,0.015)', 
                      border: '1px solid rgba(255,255,255,0.04)', 
                      borderRadius: '16px', 
                      padding: '20px', 
                      width: '100%',
                      maxWidth: '720px',
                      boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
                    }}>
                      <img 
                        src={`data:image/png;base64,${data.plots.plot_boxplot}`} 
                        alt="Feature range boxplot" 
                        style={{ width: '100%', height: 'auto', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
                      />
                      <div style={{
                        marginTop: '16px',
                        padding: '16px',
                        borderRadius: '12px',
                        background: 'rgba(239, 68, 68, 0.03)',
                        border: '1px solid rgba(239, 68, 68, 0.1)',
                        textAlign: 'left'
                      }}>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#ef4444', margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <Info size={14} /> Outliers & Statistical Ranges by Outcome Group
                        </h4>
                        <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, lineHeight: '1.5' }}>
                          This boxplot graphs the median, quartiles (interquartile range box), and outlier markers (individual dots) of a key continuous feature, split by outcome group.
                          <strong>Analytical Value:</strong> It visualizes the statistical separation. If the box regions for outcome '0' and outcome '1' are fully separated and do not overlap, it mathematically proves to clinical evaluators that this feature is a highly discriminative diagnostic predictor.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

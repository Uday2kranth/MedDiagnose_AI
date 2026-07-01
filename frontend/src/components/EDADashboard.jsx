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
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                  gap: '20px'
                }}>
                  {data.plots.plot_dist1 && (
                    <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
                      <img 
                        src={`data:image/png;base64,${data.plots.plot_dist1}`} 
                        alt="Feature 1 distribution" 
                        style={{ width: '100%', height: 'auto', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
                      />
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>First Continuous Feature Distribution</p>
                    </div>
                  )}
                  {data.plots.plot_dist2 && (
                    <div style={{ background: 'rgba(255,255,255,0.015)', border: '1px solid rgba(255,255,255,0.04)', borderRadius: '14px', padding: '12px', textAlign: 'center' }}>
                      <img 
                        src={`data:image/png;base64,${data.plots.plot_dist2}`} 
                        alt="Feature 2 distribution" 
                        style={{ width: '100%', height: 'auto', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
                      />
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Second Continuous Feature Distribution</p>
                    </div>
                  )}
                  {data.plots.plot_corr && (
                    <div style={{ 
                      background: 'rgba(255,255,255,0.015)', 
                      border: '1px solid rgba(255,255,255,0.04)', 
                      borderRadius: '14px', 
                      padding: '12px', 
                      textAlign: 'center',
                      gridColumn: '1 / -1',
                      maxWidth: '700px',
                      margin: '10px auto 0'
                    }}>
                      <img 
                        src={`data:image/png;base64,${data.plots.plot_corr}`} 
                        alt="Correlation matrix" 
                        style={{ width: '100%', height: 'auto', borderRadius: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.3)' }}
                      />
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '8px' }}>Pearson correlation heatmap</p>
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

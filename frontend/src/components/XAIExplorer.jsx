import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Brain, TrendingUp, TrendingDown, BarChart3, Loader2 } from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Cell } from 'recharts';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-tooltip">
        <p className="chart-tooltip-name">{payload[0].payload.name}</p>
        <p className="chart-tooltip-value">Importance: {payload[0].value.toFixed(4)}</p>
      </div>
    );
  }
  return null;
};

const XAIExplorer = ({ result, taskType = 'classification' }) => {
  const isRegression = taskType === 'regression';
  const [globalData, setGlobalData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGlobal = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${API_URL}/xai-global`);
        setGlobalData(res.data);
      } catch (err) {
        console.error("XAI fetch error:", err);
      }
      setLoading(false);
    };
    fetchGlobal();
  }, []);

  const maxImportance = globalData ? Math.max(...globalData.features.map(f => f.importance)) : 1;

  return (
    <div className="xai-page">
      <div className="xai-header">
        <h2><span className="text-gradient-warm">Explainable</span> <span className="text-gradient">AI Explorer</span></h2>
        <p>Understand how the model makes decisions through SHAP-based feature analysis across your entire dataset.</p>
      </div>

      {loading ? (
        <div style={{display: 'flex', justifyContent: 'center', padding: 80}}>
          <motion.div animate={{rotate: 360}} transition={{duration: 1.2, repeat: Infinity, ease: 'linear'}}>
            <Loader2 style={{width: 40, height: 40, color: 'var(--accent-lilac)'}} />
          </motion.div>
        </div>
      ) : (
        <div className="xai-grid">
          {/* Global Feature Importance Chart — no fly-in, instant render */}
          <div className="xai-card xai-full-width glass-card shimmer-border">
            <div className="xai-card-header">
              <BarChart3 style={{color: 'var(--accent-lilac)'}} />
              <h3>Global Feature Importance</h3>
              {globalData && <span style={{marginLeft: 'auto', fontSize: 11, color: 'var(--text-muted)'}}>
                Based on {globalData.sample_size} samples
              </span>}
            </div>
            <div style={{height: 320}}>
              {globalData && (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={globalData.features} layout="vertical"
                    margin={{top: 0, right: 20, left: 10, bottom: 0}}
                    animationDuration={800} animationEasing="ease-out"
                  >
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" axisLine={false} tickLine={false}
                      tick={{fill: '#888', fontSize: 12, fontWeight: 600, fontFamily: 'var(--font-mono)'}} width={120} />
                    <Tooltip cursor={{fill: 'rgba(255,255,255,0.02)'}} content={<CustomTooltip />} />
                    <Bar dataKey="importance" radius={[0, 6, 6, 0]}>
                      {globalData.features.map((f, i) => (
                        <Cell key={i} fill={f.direction === 'risk_increase' ? '#FF7F7F' : '#6EE7B7'} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>

          {/* Feature Rankings — no fly-in, bars still animate width */}
          <div className="xai-card glass-card shimmer-border">
            <div className="xai-card-header">
              <TrendingUp style={{color: 'var(--accent-peach)'}} />
              <h3>Feature Rankings</h3>
            </div>
            <div className="xai-importance-list">
              {globalData && globalData.features.map((f, i) => (
                <div key={f.name} className="xai-feature-row">
                  <span className="xai-feature-rank">#{i + 1}</span>
                  <span className="xai-feature-name">{f.name}</span>
                  <div className="xai-feature-bar-wrap">
                    <motion.div
                      className="xai-feature-bar"
                      style={{
                        background: (f.direction === 'risk_increase' || f.direction === 'value_increase')
                          ? 'linear-gradient(90deg, #FF7F7F, #FFB4D2)'
                          : 'linear-gradient(90deg, #6EE7B7, #7DD3FC)',
                      }}
                      initial={{width: 0}}
                      animate={{width: `${(f.importance / maxImportance) * 100}%`}}
                      transition={{duration: 0.8, ease: [0.16, 1, 0.3, 1], delay: i * 0.04}}
                    />
                  </div>
                  <span className="xai-feature-value">{f.importance.toFixed(3)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Direction Summary */}
          <div className="xai-card glass-card shimmer-border">
            <div className="xai-card-header">
              <TrendingDown style={{color: 'var(--accent-mint)'}} />
              <h3>{isRegression ? 'Effect Direction' : 'Risk Direction'}</h3>
            </div>
            <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
              {globalData && globalData.features.map((f) => {
                const isUp = f.direction === 'risk_increase' || f.direction === 'value_increase';
                return (
                  <div key={f.name} style={{display: 'flex', alignItems: 'center', justifyContent: 'space-between'}}>
                    <span style={{fontSize: 13, fontWeight: 600}}>{f.name}</span>
                    <span className={`xai-feature-direction ${isUp ? 'xai-dir-up' : 'xai-dir-down'}`}>
                      {isUp
                        ? (isRegression ? '↑ Increases Value' : '↑ Increases Risk')
                        : (isRegression ? '↓ Decreases Value' : '↓ Decreases Risk')
                      }
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default XAIExplorer;

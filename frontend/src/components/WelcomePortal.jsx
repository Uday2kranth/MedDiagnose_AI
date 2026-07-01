import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, LayoutDashboard, Brain, FileText, Database, MessageCircle, Play, ArrowRight } from 'lucide-react';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

export default function WelcomePortal({ onTabChange, onModelLoad, isModelReady }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleLoadDemo = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(`${API_URL}/load-sample`);
      if (res.data && res.data.status === "success") {
        onModelLoad(res.data);
        // Delay slightly for smooth transition
        setTimeout(() => {
          onTabChange('dashboard');
        }, 300);
      } else {
        setError("Invalid response received from server.");
      }
    } catch (err) {
      console.error(err);
      setError(err.response?.data?.detail || "Failed to load sample dataset. Is the server running?");
    }
    setLoading(false);
  };

  const features = [
    {
      title: "Interactive Inference",
      description: "Run single-patient predictions in real-time. Adjust health attributes using sliders and receive instant XGBoost predictions.",
      icon: LayoutDashboard,
      actionText: "Open Inference Console",
      tabId: "dashboard",
      color: "var(--accent-lilac)"
    },
    {
      title: "EDA Visualizations",
      description: "Analyze medical dataset distributions and investigate feature cross-correlation heatmaps computed directly on the backend.",
      icon: Activity,
      actionText: "View Analytical Visualizations",
      tabId: "dashboard", // In Dashboard component
      color: "var(--accent-mint)"
    },
    {
      title: "Explainable AI (XAI)",
      description: "Inspect individual and global feature contributions. Visualize SHAP values to explain EXACTLY why decisions are made.",
      icon: Brain,
      actionText: "Explore SHAP Values",
      tabId: "xai",
      color: "var(--accent-peach)"
    },
    {
      title: "Clinical PDF Reports",
      description: "Export full diagnostic summaries, input values, radar charts, and SHAP breakdowns directly into standard medical PDFs.",
      icon: FileText,
      actionText: "Download PDF Reports",
      tabId: "report",
      color: "var(--accent-coral)"
    },
    {
      title: "Batch Data Analysis",
      description: "Load an array of multiple patients, map columns automatically, and execute batch predictions in a single run.",
      icon: Database,
      actionText: "Go to Batch Console",
      tabId: "batch",
      color: "var(--accent-gold)"
    },
    {
      title: "Nurse Usagi Chatbot",
      description: "Engage with a specialized LangChain LLM medical assistant to summarize predictions, explain terms, or email reports to patients.",
      icon: MessageCircle,
      actionText: "Open Chat Drawer",
      tabId: "chatbot-drawer", // Managed by FAB but guides user
      color: "#38bdf8"
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="welcome-portal"
    >
      {/* Hero Header */}
      <div className="welcome-hero">
        <motion.div 
          className="welcome-badge"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.15, type: 'spring' }}
        >
          <span className="live-dot" /> Intelligent Medical Diagnostics
        </motion.div>
        
        <h1 className="welcome-title">
          Welcome to <span className="text-gradient">MedDiagnose AI</span>
        </h1>
        
        <p className="welcome-subtitle" style={{ maxWidth: '750px', margin: '0 auto 12px' }}>
          An advanced machine learning portal featuring auto-adaptive classification/regression pipelines, SHAP explainability, and multi-provider chatbot support.
        </p>
        
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--text-muted)',
          maxWidth: '650px',
          margin: '0 auto',
          lineHeight: '1.6',
          background: 'rgba(255, 255, 255, 0.02)',
          border: '1px solid rgba(255, 255, 255, 0.04)',
          padding: '12px 18px',
          borderRadius: '12px'
        }}>
          💡 <strong>How to Start:</strong> Navigate to the <strong>Upload Dataset</strong> tab on the sidebar to upload a patient CSV spreadsheet and train the predictive pipeline. If you do not have a dataset, click the <strong>Load Sample Dataset (Instant Demo)</strong> button below to automatically initialize the diabetes patient cohort.
        </p>

        {/* Demo Button */}
        <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleLoadDemo}
            disabled={loading}
            className="demo-load-btn"
          >
            {loading ? (
              <>
                <div className="spinner-mini" /> Loading Sample Dataset...
              </>
            ) : (
              <>
                <Play size={18} fill="currentColor" /> Load Sample Dataset (Instant Demo)
              </>
            )}
          </motion.button>
          
          {error && (
            <p style={{ color: 'var(--accent-coral)', fontSize: '13px', fontWeight: 600, marginTop: '12px' }}>
              ⚠️ {error}
            </p>
          )}
          
          {isModelReady && (
            <p style={{ color: '#34d399', fontSize: '12px', fontWeight: 600, marginTop: '8px' }}>
              ✓ Model is already trained and running live.
            </p>
          )}
        </div>
      </div>

      {/* Features Grid */}
      <div className="welcome-grid">
        {features.map((feat, idx) => {
          const Icon = feat.icon;
          return (
            <motion.div
              key={feat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + idx * 0.05, duration: 0.4 }}
              className="welcome-card glass-card"
              style={{ borderLeft: `4px solid ${feat.color}` }}
            >
              <div className="welcome-card-header">
                <div className="welcome-card-icon" style={{ background: `${feat.color}15`, color: feat.color }}>
                  <Icon size={22} />
                </div>
                <h3>{feat.title}</h3>
              </div>
              <p>{feat.description}</p>
              
              <button
                onClick={() => {
                  if (feat.tabId === "chatbot-drawer") {
                    // Open chatbot drawer
                    const fab = document.getElementById("chat-fab");
                    if (fab) fab.click();
                  } else {
                    onTabChange(feat.tabId);
                  }
                }}
                className="welcome-card-action"
                style={{ color: feat.color }}
              >
                {feat.actionText} <ArrowRight size={14} />
              </button>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FileText, Download, Activity, User, ShieldCheck, Brain } from 'lucide-react';
import axios from 'axios';
import html2pdf from 'html2pdf.js';
import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import Typewriter from './Typewriter';

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};
const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 25, stiffness: 200 } },
};

const ReportPanel = ({ 
  result, 
  predictData, 
  metrics, 
  taskType = 'classification',
  featureStats,
  chatProvider,
  chatModel,
  chatApiKey
}) => {
  const [downloading, setDownloading] = useState(false);
  const [aiInsights, setAiInsights] = useState("");
  const [loadingInsights, setLoadingInsights] = useState(false);
  const [insightsError, setInsightsError] = useState("");

  const isRegression = taskType === 'regression';

  // Prepare Radar Chart Data normalized between 0-100
  const getRadarData = () => {
    if (!featureStats || !predictData) return [];
    return Object.entries(predictData)
      .filter(([key, val]) => typeof val === 'number' && featureStats[key])
      .map(([key, val]) => {
        const stats = featureStats[key];
        const min = stats.min;
        const max = stats.max;
        const mean = stats.mean;
        const range = max - min;
        const normalizedPatient = range > 0 ? ((val - min) / range) * 100 : 50;
        const normalizedMean = range > 0 ? ((mean - min) / range) * 100 : 50;
        
        // Shorten label for radar chart if it is too long
        const displayName = key.length > 15 ? key.substring(0, 12) + '...' : key;
        
        return {
          subject: displayName,
          Patient: Math.min(100, Math.max(0, normalizedPatient)),
          Average: Math.min(100, Math.max(0, normalizedMean)),
          rawValue: val,
          rawMean: mean
        };
      });
  };

  const radarData = getRadarData();

  const generateAiInsights = async () => {
    setLoadingInsights(true);
    setInsightsError("");
    try {
      const prompt = `Based on the patient diagnostic report:
Prediction Outcome: ${result.prediction}
${isRegression ? `Model Metrics: R² Score = ${((metrics?.r2 || 0) * 100).toFixed(1)}%, MAE = ${(metrics?.mae || 0).toFixed(3)}, RMSE = ${(metrics?.rmse || 0).toFixed(3)}` : `Confidence Level: ${(result.confidence || 0).toFixed(1)}%`}

Patient Input Data:
${Object.entries(predictData).map(([k, v]) => `- ${k}: ${typeof v === 'number' ? v.toFixed(2) : v}`).join('\n')}

Top Feature Impacts (SHAP explanation):
${result.shap_summary}

Please provide:
1. A brief explanation of the diagnosis/prediction and what the metrics/confidence indicate.
2. Clinical next steps, suggestions, and recommendations (lifestyle, monitoring, or further diagnostics).

Formatting Requirements:
- ALWAYS format your response with a clear, readable structure. Never return blocky, cramped, or clustered text.
- Use double line breaks (\\n\\n) between paragraphs to ensure high readability.
- Use bold headers (e.g. **Diagnosis Explanation** and **Clinical Recommendations**) and clean bullet points.
- Do NOT make spelling mistakes, typos, or leave out letters in words. Keep it professional, empathetic, and strictly clinical.`;

      const res = await axios.post(`${API_URL}/chat`, {
        message: prompt,
        provider: chatProvider,
        model: chatModel,
        api_key: chatApiKey || "dummy"
      });
      
      setAiInsights(res.data.response);
    } catch (err) {
      console.error("Failed to generate AI insights:", err);
      const msg = err.response?.data?.detail || "Please verify that your AI Provider settings (gear icon) are configured with a valid API key.";
      setInsightsError(msg);
    }
    setLoadingInsights(false);
  };

  const handleExportPDF = () => {
    setDownloading(true);
    const element = document.getElementById('analysis-report');
    if (!element) {
      setDownloading(false);
      return;
    }

    element.classList.add('printing');

    const opt = {
      margin:       [12, 12, 12, 12],
      filename:     `meddiagnose_report_${result.prediction.toString().replace(/\s+/g, '_')}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#020a13',
        logging: false 
      },
      jsPDF:        { unit: 'mm', format: 'letter', orientation: 'portrait' },
      pagebreak:    { mode: ['css', 'legacy'], avoid: ['.report-card', '.glass-card', '.html2pdf__page-break'] }
    };

    html2pdf().from(element).set(opt).save().then(() => {
      element.classList.remove('printing');
      setDownloading(false);
    }).catch(err => {
      console.error("PDF generation error:", err);
      element.classList.remove('printing');
      setDownloading(false);
    });
  };

  const getConfidenceColor = (conf) => {
    if (conf >= 70) return 'var(--accent-mint)';
    if (conf >= 40) return 'var(--accent-gold)';
    return 'var(--accent-coral)';
  };

  if (!result) {
    return (
      <motion.div
        className="report-page"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="report-empty">
          <FileText />
          <p>Run a patient {isRegression ? 'prediction' : 'diagnosis'} to generate a report</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      className="report-page"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      {/* Header with export buttons */}
      <div className="report-header">
        <div className="report-header-left">
          <h2><span className="text-gradient-warm">Patient</span> <span className="text-gradient">Report</span></h2>
          <p>Detailed {isRegression ? 'prediction' : 'diagnostic'} breakdown with SHAP explainability data</p>
        </div>
        <div className="report-export-btns">
          <motion.button
            className="export-btn export-btn-pdf"
            onClick={handleExportPDF}
            disabled={downloading}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            id="export-pdf-btn"
            style={{
              background: 'linear-gradient(135deg, var(--accent-peach-10), var(--accent-lilac-10))',
              borderColor: 'var(--accent-peach-20)',
              color: 'var(--text-white)'
            }}
          >
            <Download /> {downloading ? "Exporting PDF..." : "Export PDF Report"}
          </motion.button>
        </div>
      </div>

      {/* Printable Report Element */}
      <div id="analysis-report" className="printable-report" style={{ padding: '8px', borderRadius: '16px' }}>
        {/* PDF-Only header */}
        <div className="pdf-only-header" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h1 style={{ margin: 0, fontSize: '24px', fontWeight: '900', letterSpacing: '-0.5px' }}>
                🧬 <span style={{ color: 'var(--accent-peach)' }}>MedDiagnose</span> AI
              </h1>
              <p style={{ margin: '4px 0 0 0', fontSize: '10px', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '2px' }}>
                Clinical Intelligence Platform
              </p>
            </div>
            <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              <strong>Diagnostic Report Summary</strong><br />
              Generated: {new Date().toLocaleString()}
            </div>
          </div>
          <div style={{ height: '1px', background: 'linear-gradient(90deg, var(--accent-peach), var(--accent-lilac), transparent)', marginTop: '14px' }} />
        </div>

        {/* Report Cards Grid */}
        <motion.div className="report-grid" variants={container} initial="hidden" animate="show">
          {/* Diagnosis / Prediction Card */}
          <motion.div className="report-card glass-card shimmer-border html2pdf__page-break" variants={item}>
            <div className="report-card-header">
              <ShieldCheck style={{ color: 'var(--accent-lilac)' }} />
              <h3>{isRegression ? 'Prediction Summary' : 'Diagnosis Summary'}</h3>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', padding: '16px 0' }}>
              <div className="report-prediction-badge">
                <Activity style={{ width: 20, height: 20, color: 'var(--accent-peach)' }} />
                <span style={{ color: 'var(--text-white)' }}>
                  {isRegression
                    ? (typeof result.prediction === 'number' ? result.prediction.toFixed(4) : result.prediction)
                    : result.prediction
                  }
                </span>
              </div>

              {isRegression ? (
                /* Regression metrics */
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'center' }}>
                  <div style={{
                    display: 'flex', gap: 20, fontSize: 13,
                  }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>R² Score</div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-peach)' }}>
                        {((metrics?.r2 || 0) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>MAE</div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-lilac)' }}>
                        {(metrics?.mae || 0).toFixed(3)}
                      </span>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: 4 }}>RMSE</div>
                      <span style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, color: 'var(--accent-mint)' }}>
                        {(metrics?.rmse || 0).toFixed(3)}
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                /* Classification metrics */
                <>
                  <div className="report-confidence-badge" style={{
                    color: getConfidenceColor(result.confidence || 0),
                    background: `${getConfidenceColor(result.confidence || 0)}11`,
                    border: `1px solid ${getConfidenceColor(result.confidence || 0)}33`,
                  }}>
                    {(result.confidence || 0).toFixed(1)}% Confidence
                  </div>
                  {metrics && metrics.accuracy != null && (
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                      Model accuracy: {(metrics.accuracy * 100).toFixed(1)}%
                    </div>
                  )}
                </>
              )}
            </div>
          </motion.div>

          {/* Patient Feature Profile (Radar Chart) */}
          <motion.div className="report-card glass-card shimmer-border html2pdf__page-break" variants={item}>
            <div className="report-card-header">
              <Activity style={{ color: 'var(--accent-peach)' }} />
              <h3>Patient Feature Profile</h3>
            </div>
            <div className="radar-chart-container" style={{ width: '100%', height: 210, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis 
                      dataKey="subject" 
                      tick={{ fill: '#8b83a8', fontSize: 9, fontWeight: 600, fontFamily: 'var(--font-sans)' }}
                    />
                    <PolarRadiusAxis 
                      angle={30} 
                      domain={[0, 100]} 
                      tick={{ fill: '#475569', fontSize: 7 }}
                      axisLine={false}
                    />
                    <Radar 
                      name="Patient" 
                      dataKey="Patient" 
                      stroke="#00d4ff" 
                      fill="#00d4ff" 
                      fillOpacity={0.25} 
                    />
                    <Radar 
                      name="Baseline Avg" 
                      dataKey="Average" 
                      stroke="#a78bfa" 
                      fill="#a78bfa" 
                      fillOpacity={0.1} 
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: 9, color: 'var(--text-muted)' }} 
                      iconSize={8}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ color: 'var(--text-secondary)', fontSize: 13, textAlign: 'center' }}>
                  Provide patient metrics to display feature comparison.
                </div>
              )}
            </div>
          </motion.div>

          {/* Patient Input Card */}
          <motion.div className="report-card glass-card shimmer-border html2pdf__page-break" variants={item}>
            <div className="report-card-header">
              <User style={{ color: 'var(--accent-peach)' }} />
              <h3>Patient Input Values</h3>
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }} className="hide-scrollbar">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>Value</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(predictData || {}).map(([k, v]) => (
                    <tr key={k}>
                      <td style={{ fontFamily: 'var(--font-sans)', fontWeight: 600 }}>{k}</td>
                      <td>{typeof v === 'number' ? v.toFixed(2) : v}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* SHAP Impact Card */}
          <motion.div className="report-card glass-card shimmer-border html2pdf__page-break" variants={item}>
            <div className="report-card-header">
              <Activity style={{ color: 'var(--accent-mint)' }} />
              <h3>SHAP Feature Impact</h3>
            </div>
            <div style={{ maxHeight: 220, overflowY: 'auto' }} className="hide-scrollbar">
              <table className="report-table">
                <thead>
                  <tr>
                    <th>Feature</th>
                    <th>SHAP Value</th>
                    <th>Direction</th>
                  </tr>
                </thead>
                <tbody>
                  {[...result.shap_impact]
                    .sort((a, b) => Math.abs(b.value) - Math.abs(a.value))
                    .map((feat) => (
                      <tr key={feat.name}>
                        <td style={{ fontFamily: 'var(--font-sans)', fontWeight: 600 }}>{feat.name}</td>
                        <td style={{ color: feat.value > 0 ? 'var(--accent-coral)' : 'var(--accent-mint)' }}>
                          {feat.value.toFixed(4)}
                        </td>
                        <td>
                          <span className={`xai-feature-direction ${feat.value > 0 ? 'xai-dir-up' : 'xai-dir-down'}`} style={{ fontSize: '10px', padding: '2px 8px' }}>
                            {feat.value > 0
                              ? (isRegression ? '↑ Up' : '↑ Risk')
                              : (isRegression ? '↓ Down' : '↓ Risk')
                            }
                          </span>
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* AI Insights Card — Full Width */}
          <motion.div className="report-card report-full-width glass-card shimmer-border html2pdf__page-break" variants={item}>
            <div className="report-card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Brain style={{ color: 'var(--accent-pink)' }} />
                <h3>AI Clinical Summary & Recommendations</h3>
              </div>
              {!aiInsights && !loadingInsights && (
                <motion.button
                  onClick={generateAiInsights}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    padding: '6px 14px',
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, var(--accent-peach), var(--accent-pink))',
                    color: '#020a13',
                    border: 'none',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(0, 212, 255, 0.2)'
                  }}
                >
                  Generate AI Insights
                </motion.button>
              )}
            </div>
            
            <div style={{ minHeight: '40px', position: 'relative' }}>
              {loadingInsights && (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px 0', gap: '10px' }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  >
                    <Activity style={{ color: 'var(--accent-pink)', width: 24, height: 24 }} />
                  </motion.div>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Analyzing diagnostic profiles and generating insights...</span>
                </div>
              )}
              
              {insightsError && (
                <div style={{ color: 'var(--accent-coral)', fontSize: '12px', padding: '8px 12px', background: 'rgba(255,107,107,0.06)', borderRadius: '8px', border: '1px solid rgba(255,107,107,0.15)' }}>
                  ⚠️ {insightsError}
                </div>
              )}
              
              {aiInsights && !loadingInsights && (
                <div 
                  className="ai-insights-markdown" 
                  style={{ 
                    fontSize: '13px', 
                    color: 'var(--text-primary)', 
                    lineHeight: '1.7',
                    whiteSpace: 'pre-wrap',
                    padding: '8px 4px'
                  }}
                >
                  <Typewriter text={aiInsights} speed={5} />
                </div>
              )}
              
              {!aiInsights && !loadingInsights && !insightsError && (
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)', fontStyle: 'italic', textAlign: 'center', padding: '16px 0' }}>
                  Please click "Generate AI Insights" to fetch automated suggestions from your configured AI Provider before exporting.
                </div>
              )}
            </div>
          </motion.div>

          {/* Top Factors Card — Full Width */}
          <motion.div className="report-card report-full-width glass-card shimmer-border html2pdf__page-break" variants={item}>
            <div className="report-card-header">
              <FileText style={{ color: 'var(--accent-pink)' }} />
              <h3>{isRegression ? 'Top Contributing Factors' : 'Top Risk Factor Summary'}</h3>
            </div>
            <pre style={{
              fontFamily: 'var(--font-mono)', fontSize: 13, color: 'var(--text-secondary)',
              lineHeight: 1.8, whiteSpace: 'pre-wrap', wordWrap: 'break-word',
            }}>
              {result.shap_summary}
            </pre>
          </motion.div>
        </motion.div>

        {/* Disclaimer */}
        <motion.div
          style={{
            marginTop: 32, padding: '16px 24px', borderRadius: 12,
            background: 'rgba(255,127,127,0.04)', border: '1px solid rgba(255,127,127,0.12)',
            fontSize: 12, color: 'var(--text-secondary)', textAlign: 'center',
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="html2pdf__page-break"
        >
          ⚠️ DISCLAIMER: This report is generated by an artificial intelligence platform analyzing machine learning features. It is NOT a professional medical diagnosis or clinical directive. Always consult with a qualified physician for healthcare decisions.
        </motion.div>
      </div>
    </motion.div>
  );
};

export default ReportPanel;


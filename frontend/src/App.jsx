import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AnimatePresence } from 'framer-motion';
import { UploadCloud, LayoutDashboard, Brain, FileText, Database, MessageCircle } from 'lucide-react';
import './App.css';

// Components
import Background from './components/Background';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import WelcomePortal from './components/WelcomePortal';
import BatchPanel from './components/BatchPanel';
import UploadScreen from './components/UploadScreen';
import ColumnPicker from './components/ColumnPicker';
import StatsRow from './components/StatsRow';
import PatientForm from './components/PatientForm';
import ResultPanel from './components/ResultPanel';
import XAIExplorer from './components/XAIExplorer';
import ReportPage from './components/ReportPanel';
import ChatDrawer from './components/ChatDrawer';
import EDADashboard from './components/EDADashboard';

// Trigger build with fresh environment variables
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

// --- Custom Hooks ---
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
};

// --- App Main ---
export default function App() {
  // Navigation state
  const [activeTab, setActiveTab] = useState('welcome');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Upload flow state
  const [step, setStep] = useState('upload'); // 'upload' | 'columns' | 'ready'
  const [columns, setColumns] = useState([]);
  const [selectedTarget, setSelectedTarget] = useState('');
  const [dataPreview, setDataPreview] = useState([]);
  const [batchData, setBatchData] = useState([]);
  const [rowCount, setRowCount] = useState(0);

  // Model state
  const [metrics, setMetrics] = useState(null);
  const [features, setFeatures] = useState([]);
  const [taskType, setTaskType] = useState('classification');
  const [featureStats, setFeatureStats] = useState(null);

  // Prediction state
  const [predictData, setPredictData] = useState({});
  const debouncedPredictData = useDebounce(predictData, 500);
  const [result, setResult] = useState(null);

  // Upload state
  const [loadingUpload, setLoadingUpload] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isInferencing, setIsInferencing] = useState(false);
  const [isTraining, setIsTraining] = useState(false);

  // Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState("");
  const [chatProvider, setChatProvider] = useState("OpenRouter");
  const [chatModel, setChatModel] = useState("openrouter/owl-alpha");
  const [chatApiKey, setChatApiKey] = useState("");

  const [backendOnline, setBackendOnline] = useState(null);
  const [serverKeys, setServerKeys] = useState({});

  // Backend connection health checking
  useEffect(() => {
    const checkHealth = async () => {
      try {
        const res = await axios.get(`${API_URL}/health`);
        if (res.data && res.data.status === "ok") {
          setBackendOnline(true);
        } else {
          setBackendOnline(false);
        }
      } catch (err) {
        setBackendOnline(false);
      }
    };
    checkHealth();
    const interval = setInterval(checkHealth, 8000);
    return () => clearInterval(interval);
  }, []);

  // Fetch server API keys status
  useEffect(() => {
    const fetchKeysStatus = async () => {
      try {
        const res = await axios.get(`${API_URL}/keys-status`);
        setServerKeys(res.data || {});
      } catch (err) {
        console.error("Failed to fetch keys status:", err);
      }
    };
    if (backendOnline) {
      fetchKeysStatus();
    }
  }, [backendOnline]);

  // Real-time Inference Trigger
  useEffect(() => {
    if (metrics && Object.keys(debouncedPredictData).length > 0) {
      const hasNonZero = Object.values(debouncedPredictData).some(v => v !== 0);
      if (hasNonZero) {
        runPrediction(debouncedPredictData);
      }
    }
  }, [debouncedPredictData]);

  // --- Handlers ---
  const loadSampleData = async () => {
    try {
      const res = await axios.get(`${API_URL}/sample`);
      setPredictData(res.data.sample);
    } catch (err) {
      console.error("Failed to load sample:", err);
    }
  };

  // Step 1: Upload file → get columns
  const handleUploadFile = async (file) => {
    if (!file) return;
    setLoadingUpload(true);
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_URL}/columns`, formData);
      setColumns(res.data.columns);
      setDataPreview(res.data.preview || []);
      setRowCount(res.data.rows || 0);
      // Auto-select last column as target (common convention)
      setSelectedTarget(res.data.columns[res.data.columns.length - 1]);
      setLoadingUpload(false);
      setUploadSuccess(true);
      setTimeout(() => setStep('columns'), 800);
    } catch (err) {
      setLoadingUpload(false);
      alert("Upload failed: " + (err.response?.data?.detail || err.message));
    }
  };

  // Step 2: Train with selected target
  const handleTrainModel = async () => {
    setIsTraining(true);
    const formData = new FormData();
    formData.append("target_col", selectedTarget);

    try {
      const res = await axios.post(`${API_URL}/upload`, formData);
      setMetrics(res.data.metrics);
      setFeatures(res.data.features);
      setTaskType(res.data.task_type || 'classification');
      setFeatureStats(res.data.feature_stats || null);
      setBatchData(dataPreview || []);
      setStep('ready');

      // Initialize with zeros then auto-load sample
      const initData = {};
      res.data.features.forEach(f => initData[f] = 0);
      setPredictData(initData);

      try {
        const sampleRes = await axios.get(`${API_URL}/sample`);
        setPredictData(sampleRes.data.sample);
      } catch (err) {
        console.log("Could not auto-load sample, using zeros");
      }
    } catch (err) {
      alert("Training failed: " + (err.response?.data?.detail || err.message));
    }
    setIsTraining(false);
  };

  const handleDragOver = (e) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleUploadFile(e.dataTransfer.files[0]);
    }
  };

  const handleFieldChange = (feat, value) => {
    setPredictData({ ...predictData, [feat]: value });
  };

  const runPrediction = async (dataPayload) => {
    setIsInferencing(true);
    try {
      const res = await axios.post(`${API_URL}/predict`, dataPayload);
      setResult(res.data);
      if (messages.length === 0) {
        const taskMsg = res.data.task_type === 'regression'
          ? `I've analyzed the report. Predicted value: **${res.data.prediction}**. R² Score: ${((res.data.r2 || 0) * 100).toFixed(1)}%. How can I help you interpret this?`
          : `I've analyzed the report. Patient diagnosis: **${res.data.prediction}**. Confidence is ${(res.data.confidence || 0).toFixed(1)}%. How can I help you interpret this?`;
        setMessages([{ role: "assistant", content: taskMsg }]);
      }
    } catch (err) {
      console.error("Prediction error:", err);
    }
    setIsInferencing(false);
  };

  const sendChat = async (e) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const msg = chatInput;
    setChatInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);

    try {
      const res = await axios.post(`${API_URL}/chat`, {
        message: msg,
        provider: chatProvider,
        model: chatModel,
        api_key: chatApiKey
      });
      setMessages(prev => [...prev, { role: "assistant", content: res.data.response }]);
    } catch (err) {
      const errorMsg = err.response?.data?.detail || "Error connecting to AI. Make sure the backend is running and configured.";
      setMessages(prev => [...prev, { role: "assistant", content: `⚠️ ${errorMsg}` }]);
    }
  };

  const handleResetSession = () => {
    setMetrics(null);
    setFeatures([]);
    setFeatureStats(null);
    setPredictData({});
    setResult(null);
    setBatchData([]);
    setStep('upload');
    setUploadSuccess(false);
    setActiveTab('upload');
  };

  // Render current tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'welcome':
        return (
          <WelcomePortal
            key="welcome"
            onTabChange={setActiveTab}
            isModelReady={!!metrics}
            onModelLoad={(data) => {
              setMetrics(data.metrics);
              setFeatures(data.features);
              setTaskType(data.task_type);
              setFeatureStats(data.feature_stats);
              setPredictData(data.sample);
              setBatchData(data.batch_data || []);
              setStep('ready');
            }}
          />
        );
      case 'upload':
        return (
          <div key="upload-active" className="reset-container" style={{
            background: 'rgba(255, 255, 255, 0.02)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            borderRadius: '16px',
            padding: '40px',
            textAlign: 'center',
            maxWidth: '800px',
            margin: '40px auto',
            backdropFilter: 'blur(20px)',
            boxShadow: 'var(--shadow-lg)'
          }}>
            <h2 style={{ color: 'var(--text-white)', marginBottom: '16px', fontWeight: '800', letterSpacing: '-0.02em' }}>Active Dataset Session</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px', lineHeight: '1.6' }}>
              A clinical dataset is currently loaded, and the predictive machine learning model has been trained. To analyze a different dataset, you can reset the current active session.
            </p>
            <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', marginBottom: '8px' }}>
              <button 
                onClick={handleResetSession}
                className="btn-primary"
                style={{
                  background: 'linear-gradient(135deg, #ef4444, #f87171)',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '12px',
                  fontWeight: '700',
                  cursor: 'pointer',
                  boxShadow: '0 4px 14px rgba(239, 68, 68, 0.3)'
                }}
              >
                Reset Session & Upload New CSV
              </button>
            </div>

            <div style={{ margin: '30px 0 10px', borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: '24px' }}>
              <h3 style={{ color: 'var(--text-white)', fontSize: '14px', fontWeight: '700', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                🚀 Direct Access Directories
              </h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '14px', textAlign: 'left' }}>
                
                {/* Inference Console */}
                <div 
                  onClick={() => setActiveTab('dashboard')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.015)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(0, 212, 255, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(0, 212, 255, 0.25)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.015)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#00d4ff', fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>
                    <LayoutDashboard size={14} /> Inference Console
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                    Run real-time predictions for single patients and view individual SHAP explanations.
                  </p>
                </div>

                {/* XAI Explorer */}
                <div 
                  onClick={() => setActiveTab('xai')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.015)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(14, 246, 204, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(14, 246, 204, 0.25)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.015)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#0ef6cc', fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>
                    <Brain size={14} /> XAI Explorer
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                    Examine global feature importance to understand the overall risk drivers of your model.
                  </p>
                </div>

                {/* Diagnostic Report */}
                <div 
                  onClick={() => setActiveTab('report')}
                  style={{
                    background: 'rgba(255, 255, 255, 0.015)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(244, 114, 182, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(244, 114, 182, 0.25)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.015)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#f472b6', fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>
                    <FileText size={14} /> Diagnostic Report
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                    Generate a complete clinical summary and email diagnostic findings to patients.
                  </p>
                </div>

                {/* Chat with Nurse Usagi */}
                <div 
                  onClick={() => setChatOpen(true)}
                  style={{
                    background: 'rgba(255, 255, 255, 0.015)',
                    border: '1px solid rgba(255, 255, 255, 0.04)',
                    borderRadius: '12px',
                    padding: '14px 18px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = 'rgba(56, 189, 248, 0.04)';
                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.25)';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'rgba(255, 255, 255, 0.015)';
                    e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.04)';
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#38bdf8', fontWeight: '700', fontSize: '13px', marginBottom: '4px' }}>
                    <MessageCircle size={14} /> Nurse Usagi Chat
                  </div>
                  <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, lineHeight: '1.4' }}>
                    Engage with the specialized clinical AI chatbot assistant to interpret predictions.
                  </p>
                </div>

              </div>
            </div>
          </div>
        );
      case 'batch':
        return (
          <BatchPanel
            key="batch"
            batchData={batchData}
            metrics={metrics}
            taskType={taskType}
            onReset={handleResetSession}
          />
        );
      case 'xai':
        return <XAIExplorer key="xai" result={result} taskType={taskType} />;
      case 'report':
        return (
          <ReportPage
            key="report"
            result={result}
            predictData={predictData}
            metrics={metrics}
            taskType={taskType}
            featureStats={featureStats}
            chatProvider={chatProvider}
            chatModel={chatModel}
            chatApiKey={chatApiKey}
          />
        );
      case 'dashboard':
      default:
        return (
          <div key="dashboard">
            <StatsRow metrics={metrics} taskType={taskType} />
            <div className="dashboard-grid">
              <PatientForm
                features={features}
                predictData={predictData}
                onFieldChange={handleFieldChange}
                onLoadSample={loadSampleData}
              />
              <ResultPanel
                result={result}
                isInferencing={isInferencing}
                taskType={taskType}
              />
            </div>
            <EDADashboard isModelReady={!!metrics} />
          </div>
        );
    }
  };

  return (
    <div className={`app-layout ${sidebarCollapsed ? 'sidebar-collapsed-layout' : 'sidebar-expanded-layout'}`}>
      <Sidebar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        isModelReady={!!metrics}
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
        backendOnline={backendOnline}
      />
      
      <div className="app-main-content-layout">
        <Background />
        <Navbar
          isModelReady={!!metrics}
          backendOnline={backendOnline}
        />

        {backendOnline === false && (
          <div style={{
            background: 'rgba(255, 107, 107, 0.08)',
            border: '1px solid rgba(255, 107, 107, 0.25)',
            color: 'var(--accent-coral)',
            padding: '10px 18px',
            borderRadius: '12px',
            margin: '20px auto 0',
            maxWidth: '1200px',
            textAlign: 'center',
            fontSize: '13px',
            fontWeight: 600,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <span>⚠️ Connection to MedDiagnose AI Backend lost. Please check if the server is running on port 8000.</span>
          </div>
        )}

        <main className="main-content container">
          <AnimatePresence mode="wait">
            {step === 'upload' && activeTab === 'welcome' ? (
              renderTabContent()
            ) : step === 'upload' ? (
              <UploadScreen
                key="upload"
                loadingUpload={loadingUpload}
                uploadSuccess={uploadSuccess}
                isDragging={isDragging}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onFileSelect={handleUploadFile}
              />
            ) : step === 'columns' ? (
              <ColumnPicker
                key="columns"
                columns={columns}
                selectedTarget={selectedTarget}
                onTargetChange={setSelectedTarget}
                onConfirm={handleTrainModel}
                dataPreview={dataPreview}
                rowCount={rowCount}
              />
            ) : (
              renderTabContent()
            )}
          </AnimatePresence>
        </main>

        <ChatDrawer
          isOpen={chatOpen}
          onOpen={() => setChatOpen(true)}
          onClose={() => setChatOpen(false)}
          messages={messages}
          chatInput={chatInput}
          onInputChange={setChatInput}
          onSend={sendChat}
          isVisible={!!metrics}
          chatProvider={chatProvider}
          setChatProvider={setChatProvider}
          chatModel={chatModel}
          setChatModel={setChatModel}
          chatApiKey={chatApiKey}
          setChatApiKey={setChatApiKey}
          onClearChat={() => setMessages([])}
          serverKeys={serverKeys}
        />
      </div>
    </div>
  );
}

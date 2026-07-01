import React, { useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Settings, Key, Zap, Globe, Check, AlertTriangle, Maximize2, Minimize2, Trash2 } from 'lucide-react';
import Typewriter from './Typewriter';

// ── Provider → Model Registry ──
// Models tagged [Agent ✓] support tool calling (email, etc.)
// Models tagged [Text Only] are for summarization/chat only
const PROVIDER_OPTIONS = {
  "Google Gemini": [
    { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash", agent: true },
    { id: "gemini-2.5-flash", label: "Gemini 2.5 Flash", agent: true },
    { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash", agent: true },
    { id: "gemini-1.5-pro", label: "Gemini 1.5 Pro", agent: true },
    { id: "gemini-2.0-flash-001", label: "Gemini 2.0 Flash (Stable)", agent: true },
    { id: "gemini-1.5-flash-002", label: "Gemini 1.5 Flash (Stable)", agent: true },
    { id: "gemini-1.5-pro-002", label: "Gemini 1.5 Pro (Stable)", agent: true }
  ],
  "OpenRouter": [
    { id: "openrouter/owl-alpha", label: "Owl Alpha", agent: false },
    { id: "nvidia/nemotron-3-ultra-550b-a55b:free", label: "NVIDIA: Nemotron 3 Ultra (free)", agent: false },
    { id: "google/gemma-4-31b-it:free", label: "Google: Gemma 4 31B (free)", agent: false },
    { id: "poolside/laguna-m.1:free", label: "Poolside: Laguna M.1 (free)", agent: false },
    { id: "nvidia/nemotron-3-super-120b-a12b:free", label: "NVIDIA: Nemotron 3 Super (free)", agent: true },
    { id: "openai/gpt-oss-120b:free", label: "OpenAI: gpt-oss-120b (free)", agent: false },
    { id: "poolside/laguna-xs.2:free", label: "Poolside: Laguna XS.2 (free)", agent: false },
    { id: "cohere/north-mini-code:free", label: "Cohere: North Mini Code (free)", agent: false },
    { id: "openrouter/free", label: "randome free model roulette", agent: true },
    { id: "cognitivecomputations/dolphin-mistral-24b-venice-edition:free", label: "Venice: Uncensored (free)", agent: true },
    { id: "openai/gpt-oss-20b:free", label: "OpenAI: gpt-oss-20b (free)", agent: false },
    { id: "nvidia/nemotron-3-nano-30b-a3b:free", label: "NVIDIA: Nemotron 3 Nano 30B A3B (free)", agent: false },
    { id: "google/gemma-4-26b-a4b-it:free", label: "Google: Gemma 4 26B A4B (free)", agent: false },
    { id: "nvidia/nemotron-nano-9b-v2:free", label: "NVIDIA: Nemotron Nano 9B V2 (free)", agent: false },
    { id: "nousresearch/hermes-3-llama-3.1-405b:free", label: "Nous Research: Hermes 3 Llama 3.1 405B (free)", agent: true },
    { id: "qwen/qwen3-coder:free", label: "Qwen: Qwen3 Coder 480B A35B (free)", agent: true },
    { id: "meta-llama/llama-3.3-70b-instruct:free", label: "Meta: Llama 3.3 70B Instruct (free)", agent: true }
  ],
  "NVIDIA NIM": [
    { id: "meta/llama-3.1-405b-instruct", label: "🦙 Llama 3.1 405B", agent: true },
    { id: "meta/llama-3.1-70b-instruct", label: "🦙 Llama 3.1 70B", agent: true },
    { id: "meta/llama-3-70b-instruct", label: "🦙 Llama 3 70B", agent: true },
    { id: "mistralai/mixtral-8x22b-instruct", label: "🌀 Mixtral 8x22B", agent: true },
    { id: "mistralai/mistral-large", label: "🌀 Mistral Large", agent: true },
    { id: "qwen/qwen3-next", label: "🧠 Qwen 3 Next", agent: true },
    { id: "zhipuai/glm-5.1", label: "🧠 GLM 5.1", agent: true },
    { id: "zhipuai/glm-4", label: "🧠 GLM 4", agent: true },
    { id: "minimax/minimax-m3", label: "🧠 MiniMax M3", agent: true }
  ]
};

const PROVIDER_NEEDS_KEY = {
  "Google Gemini": true,
  "OpenRouter": true,
  "NVIDIA NIM": true
};

const ChatDrawer = ({
  isOpen,
  onOpen,
  onClose,
  messages,
  chatInput,
  onInputChange,
  onSend,
  isVisible,
  chatProvider,
  setChatProvider,
  chatModel,
  setChatModel,
  chatApiKey,
  setChatApiKey,
  onClearChat,
  serverKeys = {}
}) => {
  const chatEndRef = useRef(null);
  const [isMaximized, setIsMaximized] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsConfirmed, setSettingsConfirmed] = useState(false);
  const [showConfirmBadge, setShowConfirmBadge] = useState(false);

  // Staging state for settings (only applied on "Apply")
  const [stagedProvider, setStagedProvider] = useState(chatProvider);
  const [stagedModel, setStagedModel] = useState(chatModel);
  const [stagedApiKey, setStagedApiKey] = useState(chatApiKey);

  // Auto-scroll when messages change
  React.useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Sync staged state when settings panel opens
  React.useEffect(() => {
    if (settingsOpen) {
      setStagedProvider(chatProvider);
      setStagedModel(chatModel);
      setStagedApiKey(chatApiKey);
    }
  }, [settingsOpen]);

  const handleProviderChange = (e) => {
    const newProv = e.target.value;
    setStagedProvider(newProv);
    const models = PROVIDER_OPTIONS[newProv] || [];
    setStagedModel(models.length > 0 ? models[0].id : "");
  };

  const handleApplySettings = () => {
    setChatProvider(stagedProvider);
    setChatModel(stagedModel);
    setChatApiKey(stagedApiKey);
    setSettingsConfirmed(true);
    setShowConfirmBadge(true);

    // Close settings panel after brief confirmation
    setTimeout(() => setSettingsOpen(false), 600);
    // Fade the badge after 3 seconds
    setTimeout(() => setShowConfirmBadge(false), 3000);
  };

  const handleSendOrSettings = (e) => {
    e.preventDefault();
    onSend(e);
  };

  const currentModels = PROVIDER_OPTIONS[stagedProvider] || [];
  const selectedModelObj = currentModels.find(m => m.id === (settingsOpen ? stagedModel : chatModel));
  const isAgentCapable = selectedModelObj ? selectedModelObj.agent : true;
  const hasServerKey = serverKeys[stagedProvider];

  return (
    <>
      {/* Floating Action Button */}
      <AnimatePresence>
        {isVisible && !isOpen && (
          <motion.button
            key="chat-fab"
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', damping: 18, stiffness: 300 }}
            onClick={onOpen}
            className="chat-fab"
            id="chat-fab"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <MessageCircle />
            <div className="chat-fab-pulse" />
            {messages.length > 0 && <span className="chat-fab-badge" />}
          </motion.button>
        )}
      </AnimatePresence>

      {/* Chat Drawer */}
      <div
        className={`chat-drawer ${isMaximized ? 'maximized' : ''} ${isOpen ? 'open' : 'closed'}`}
        id="chat-drawer"
      >
        {/* Gradient accent bar */}
        <div className="chat-drawer-accent" />

        {/* Header */}
        <div className="chat-header">
          <div className="chat-header-left" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <img
                src="https://i.ibb.co/xSWzZpdV/nurse-usagi.jpg"
                alt="Nurse Usagi"
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  border: '1px solid rgba(255,255,255,0.2)',
                  boxShadow: '0 0 10px rgba(0, 212, 255, 0.3)'
                }}
              />
              <span className="chat-header-dot" style={{ position: 'absolute', bottom: '-2px', right: '-2px', width: '8px', height: '8px', border: '1px solid #020a13' }} />
            </div>
            <div>
              <h3 style={{ fontSize: '13px', fontWeight: '800', letterSpacing: '-0.02em', color: 'var(--text-bright, #fff)' }}>Nurse Usagi</h3>
              <p style={{ fontSize: '9px', color: '#6EE7B7', fontWeight: '600', margin: '0', display: 'flex', alignItems: 'center', gap: '3px' }}>
                Clinical AI Assistant
              </p>
            </div>
            {/* Active provider badge */}
            <AnimatePresence>
              {showConfirmBadge && (
                <motion.span
                  initial={{ opacity: 0, scale: 0.8, x: -10 }}
                  animate={{ opacity: 1, scale: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  style={{
                    fontSize: 10, fontWeight: 700,
                    padding: '3px 8px', borderRadius: 20,
                    background: 'rgba(110, 231, 183, 0.15)',
                    color: '#6EE7B7',
                    border: '1px solid rgba(110, 231, 183, 0.3)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  ✓ Settings Applied
                </motion.span>
              )}
            </AnimatePresence>
          </div>
          <div className="chat-header-right" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {/* Active provider mini-badge */}
            {settingsConfirmed && !showConfirmBadge && (
              <span style={{
                fontSize: 9, fontWeight: 600, padding: '2px 6px',
                borderRadius: 12, background: 'rgba(255,255,255,0.05)',
                color: 'var(--text-muted)', border: '1px solid rgba(255,255,255,0.08)',
              }}>
                {chatProvider.split(' ')[0]}
              </span>
            )}
            {messages.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear the chat history?")) {
                    onClearChat();
                  }
                }}
                className="btn-icon"
                title="Clear Chat History"
                style={{
                  color: '#ef4444',
                  borderColor: 'rgba(239, 68, 68, 0.15)',
                  background: 'rgba(239, 68, 68, 0.05)',
                  marginRight: '4px'
                }}
              >
                <Trash2 style={{ width: 16, height: 16 }} />
              </button>
            )}
            <button
              onClick={() => setIsMaximized(!isMaximized)}
              className={`btn-icon ${isMaximized ? 'active' : ''}`}
              title={isMaximized ? "Restore Size" : "Expand to Full Height"}
            >
              {isMaximized ? <Minimize2 style={{ width: 16, height: 16 }} /> : <Maximize2 style={{ width: 16, height: 16 }} />}
            </button>
            <button
              onClick={() => setSettingsOpen(!settingsOpen)}
              className={`btn-icon ${settingsOpen ? 'active' : ''}`}
              title="AI Settings"
            >
              <Settings style={{ width: 16, height: 16 }} />
            </button>
            <button
              onClick={onClose}
              className="btn-icon"
              id="chat-close-btn"
              aria-label="Close chat"
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* Settings Overlay */}
        <AnimatePresence>
          {settingsOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="chat-settings-panel"
              style={{
                backgroundColor: 'rgba(20, 20, 25, 0.95)',
                borderBottom: '1px solid rgba(255,255,255,0.1)',
                padding: '16px',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                overflow: 'hidden',
              }}
            >
              {/* Provider Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#999', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Globe size={12} /> Provider
                </label>
                <select
                  value={stagedProvider}
                  onChange={handleProviderChange}
                  style={{ background: '#1a1a24', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                >
                  {Object.keys(PROVIDER_OPTIONS).map(prov => (
                    <option key={prov} value={prov}>{prov}</option>
                  ))}
                </select>
              </div>

              {/* Model Selection */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '11px', color: '#999', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={12} /> Model
                </label>
                <select
                  value={stagedModel}
                  onChange={(e) => setStagedModel(e.target.value)}
                  style={{ background: '#1a1a24', color: 'white', border: '1px solid rgba(255,255,255,0.1)', padding: '8px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}
                >
                  {currentModels.map(mod => (
                    <option key={mod.id} value={mod.id}>
                      {mod.label} {mod.agent ? '' : '⚠️'}
                    </option>
                  ))}
                </select>
                {/* Agent capability warning */}
                {!isAgentCapable && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '6px',
                      fontSize: '10px', color: '#fbbf24',
                      background: 'rgba(251, 191, 36, 0.08)',
                      border: '1px solid rgba(251, 191, 36, 0.15)',
                      padding: '6px 10px', borderRadius: '6px', marginTop: '4px',
                    }}
                  >
                    <AlertTriangle size={12} />
                    Text-only model — cannot use tools (email, etc.)
                  </motion.div>
                )}
              </div>

              {/* API Key Input */}
              {PROVIDER_NEEDS_KEY[stagedProvider] && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  <label style={{ fontSize: '11px', color: hasServerKey ? '#6EE7B7' : '#94a3b8', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Key size={12} /> API Key {hasServerKey ? <span style={{ opacity: 0.9 }}>✓ Server Key Active</span> : <span style={{ opacity: 0.6 }}>(Optional if set on server)</span>}
                  </label>
                  <input
                    type="password"
                    value={stagedApiKey}
                    onChange={(e) => setStagedApiKey(e.target.value)}
                    placeholder={hasServerKey ? "Using server default key" : "Enter key or leave blank to use server default"}
                    style={{
                      background: '#1a1a24', color: 'white',
                      border: `1px solid ${stagedApiKey.trim() ? 'rgba(110, 231, 183, 0.3)' : (hasServerKey ? 'rgba(110, 231, 183, 0.15)' : 'rgba(255,107,107,0.3)')}`,
                      padding: '8px 12px', borderRadius: '6px', fontSize: '12px',
                      transition: 'border-color 0.2s ease',
                    }}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleApplySettings(); } }}
                  />
                </div>
              )}

              {/* Apply Button */}
              <motion.button
                onClick={handleApplySettings}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                disabled={PROVIDER_NEEDS_KEY[stagedProvider] && !hasServerKey && !stagedApiKey.trim()}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  width: '100%', padding: '10px',
                  fontSize: '13px', fontWeight: 700,
                  fontFamily: 'var(--font-sans, Inter, sans-serif)',
                  color: (PROVIDER_NEEDS_KEY[stagedProvider] && !hasServerKey && !stagedApiKey.trim()) ? '#666' : '#000',
                  background: (PROVIDER_NEEDS_KEY[stagedProvider] && !hasServerKey && !stagedApiKey.trim())
                    ? 'rgba(255,255,255,0.05)'
                    : 'linear-gradient(135deg, #6EE7B7, #7DD3FC)',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: (PROVIDER_NEEDS_KEY[stagedProvider] && !hasServerKey && !stagedApiKey.trim()) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: (PROVIDER_NEEDS_KEY[stagedProvider] && !hasServerKey && !stagedApiKey.trim())
                    ? 'none'
                    : '0 4px 16px rgba(110, 231, 183, 0.2)',
                }}
              >
                <Check size={14} />
                Apply Settings
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="chat-messages hide-scrollbar">
          {messages.length === 0 ? (
            <div className="chat-empty">
              <div className="chat-empty-icon">
                <MessageCircle />
              </div>
              <p>AI Assistant Ready.</p>
              {!settingsConfirmed && PROVIDER_NEEDS_KEY[chatProvider] && !chatApiKey && (
                <p style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: -8 }}>
                  Click ⚙️ to configure your AI provider
                </p>
              )}
            </div>
          ) : (
            messages.map((m, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', damping: 25, delay: 0.05 }}
                className={`chat-msg ${m.role === 'user' ? 'chat-msg-user' : 'chat-msg-assistant'}`}
              >
                <div className={`chat-bubble ${m.role === 'user' ? 'chat-bubble-user' : 'chat-bubble-assistant'}`}>
                  {m.role === 'assistant' ? <Typewriter text={m.content} speed={8} /> : m.content}
                </div>
              </motion.div>
            ))
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input */}
        <div className="chat-input-bar">
          <form onSubmit={handleSendOrSettings} className="chat-input-form">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={
                PROVIDER_NEEDS_KEY[chatProvider] && !chatApiKey
                  ? `Click ⚙️ to enter your ${chatProvider} API Key...`
                  : "Ask to analyze or email the report..."
              }
              className="chat-input"
              id="chat-message-input"
            />
            <button type="submit" className="chat-send-btn" id="chat-send-btn" aria-label="Send message">
              <Send />
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default ChatDrawer;

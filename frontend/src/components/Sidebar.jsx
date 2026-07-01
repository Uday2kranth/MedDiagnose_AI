import React from 'react';
import { motion } from 'framer-motion';
import { 
  Home, 
  UploadCloud, 
  LayoutDashboard, 
  Brain, 
  FileText, 
  Database, 
  ChevronLeft, 
  ChevronRight, 
  Activity 
} from 'lucide-react';

const tabs = [
  { 
    id: 'welcome', 
    label: 'Welcome Portal', 
    desc: 'Introduction & quick start', 
    icon: Home,
    requiresModel: false 
  },
  { 
    id: 'upload', 
    label: 'Upload Dataset', 
    desc: 'Upload CSV & train model', 
    icon: UploadCloud,
    requiresModel: false 
  },
  { 
    id: 'dashboard', 
    label: 'Inference Console', 
    desc: 'Patient real-time prediction', 
    icon: LayoutDashboard,
    requiresModel: true 
  },
  { 
    id: 'batch', 
    label: 'Batch Analysis', 
    desc: 'Evaluate patient matrices', 
    icon: Database,
    requiresModel: true 
  },
  { 
    id: 'xai', 
    label: 'XAI Explorer', 
    desc: 'SHAP explanation graphs', 
    icon: Brain,
    requiresModel: true 
  },
  { 
    id: 'report', 
    label: 'Diagnostic Report', 
    desc: 'Clinical summary exports', 
    icon: FileText,
    requiresModel: true 
  }
];

export default function Sidebar({ 
  activeTab, 
  onTabChange, 
  isModelReady, 
  collapsed, 
  onToggle, 
  backendOnline 
}) {
  return (
    <aside className={`app-sidebar ${collapsed ? 'collapsed' : 'expanded'}`} id="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <motion.div 
          className="sidebar-logo"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          <Activity />
        </motion.div>
        {!collapsed && (
          <span className="sidebar-title">MedDiagnose AI</span>
        )}
      </div>

      {/* Navigation Items */}
      <nav className="sidebar-items">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isTabDisabled = tab.requiresModel && !isModelReady;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              className={`sidebar-item ${isActive ? 'active' : ''} ${isTabDisabled ? 'disabled' : ''} ${tab.id}-tab`}
              disabled={isTabDisabled}
              onClick={() => onTabChange(tab.id)}
              title={collapsed ? tab.label : undefined}
              id={`sidebar-tab-${tab.id}`}
            >
              <div className="sidebar-item-icon">
                <Icon size={20} />
              </div>
              {!collapsed && (
                <div className="sidebar-item-text">
                  <span className="sidebar-item-label">{tab.label}</span>
                  <span className="sidebar-item-desc">{tab.desc}</span>
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* Footer & Toggle Toggler */}
      <div className="sidebar-footer">
        {/* Connection status inside sidebar footer if collapsed */}
        {collapsed && (
          <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
            <span 
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: backendOnline === true 
                  ? '#34d399' 
                  : backendOnline === false 
                    ? '#f87171' 
                    : '#fbbf24',
                boxShadow: backendOnline === true 
                  ? '0 0 8px #34d399' 
                  : backendOnline === false 
                    ? '0 0 8px #f87171' 
                    : '0 0 8px #fbbf24'
              }}
              title={backendOnline === true ? 'Server Online' : 'Server Offline'}
            />
          </div>
        )}
        
        <button 
          onClick={onToggle}
          className="sidebar-toggle-btn"
          id="sidebar-toggle-button"
          title={collapsed ? "Expand Menu" : "Collapse Menu"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          {!collapsed && <span style={{ fontSize: '12px', fontWeight: 600 }}>Collapse Sidebar</span>}
        </button>
      </div>
    </aside>
  );
}

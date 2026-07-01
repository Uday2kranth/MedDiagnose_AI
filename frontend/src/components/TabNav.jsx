import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Brain, FileText } from 'lucide-react';

const tabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'xai', label: 'XAI Explorer', icon: Brain },
  { id: 'report', label: 'Report', icon: FileText },
];

const TabNav = ({ activeTab, onTabChange }) => {
  return (
    <div className="tab-nav" id="tab-nav">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            className={`tab-item ${isActive ? 'tab-item-active' : ''}`}
            onClick={() => onTabChange(tab.id)}
            id={`tab-${tab.id}`}
          >
            {isActive && (
              <motion.div
                layoutId="tab-indicator"
                className="tab-indicator"
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              />
            )}
            <Icon style={{ position: 'relative', zIndex: 1 }} />
            <span style={{ position: 'relative', zIndex: 1 }}>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default TabNav;

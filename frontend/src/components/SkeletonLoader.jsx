import React from 'react';
import { motion } from 'framer-motion';

const SkeletonLoader = () => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
    className="skeleton-overlay"
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 24 }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div className="skeleton-bar skeleton-bar-sm" />
        <div className="skeleton-bar skeleton-bar-lg" />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div className="skeleton-bar skeleton-bar-sm" />
        <div className="skeleton-bar" style={{ width: 48, height: 48, borderRadius: '50%' }} />
      </div>
    </div>
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14, paddingTop: 16 }}>
      <div className="skeleton-bar skeleton-bar-md" style={{ marginBottom: 8 }} />
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="skeleton-bar skeleton-bar-full" />
      ))}
    </div>
  </motion.div>
);

export default SkeletonLoader;

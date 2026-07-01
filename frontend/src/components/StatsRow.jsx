import React from 'react';
import { motion } from 'framer-motion';
import { Award, Activity, HeartPulse, TrendingUp, Target } from 'lucide-react';

const AnimatedCounter = ({ value, suffix = '', decimals = 0 }) => {
  const [display, setDisplay] = React.useState(0);
  React.useEffect(() => {
    const target = parseFloat(value) || 0;
    const duration = 1200;
    const startTime = performance.now();
    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 4);
      setDisplay(eased * target);
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value]);
  return <>{display.toFixed(decimals)}{suffix}</>;
};

const classificationStats = [
  {
    key: 'accuracy', label: 'Accuracy Score', icon: Award,
    format: (v) => <AnimatedCounter value={(v || 0) * 100} suffix="%" decimals={1} />,
    color: 'var(--accent-peach)', bg: 'var(--accent-peach-10)', glow: 'rgba(255, 204, 170, 0.3)',
  },
  {
    key: 'samples', label: 'Total Samples', icon: Activity,
    format: (v) => <AnimatedCounter value={v || 0} decimals={0} />,
    color: 'var(--accent-lilac)', bg: 'var(--accent-lilac-10)', glow: 'rgba(196, 181, 253, 0.3)',
  },
  {
    key: 'features', label: 'Features Built', icon: HeartPulse,
    format: (v) => <AnimatedCounter value={v || 0} decimals={0} />,
    color: 'var(--accent-mint)', bg: 'var(--accent-mint-10)', glow: 'rgba(110, 231, 183, 0.3)',
  },
];

const regressionStats = [
  {
    key: 'r2', label: 'R² Score', icon: Target,
    format: (v) => <AnimatedCounter value={(v || 0) * 100} suffix="%" decimals={1} />,
    color: 'var(--accent-peach)', bg: 'var(--accent-peach-10)', glow: 'rgba(255, 204, 170, 0.3)',
  },
  {
    key: 'mae', label: 'Mean Abs Error', icon: TrendingUp,
    format: (v) => <AnimatedCounter value={v || 0} decimals={3} />,
    color: 'var(--accent-lilac)', bg: 'var(--accent-lilac-10)', glow: 'rgba(196, 181, 253, 0.3)',
  },
  {
    key: 'samples', label: 'Total Samples', icon: Activity,
    format: (v) => <AnimatedCounter value={v || 0} decimals={0} />,
    color: 'var(--accent-mint)', bg: 'var(--accent-mint-10)', glow: 'rgba(110, 231, 183, 0.3)',
  },
];

const StatsRow = ({ metrics, taskType = 'classification' }) => {
  const stats = taskType === 'regression' ? regressionStats : classificationStats;

  return (
    <motion.div
      className="stats-row"
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', damping: 25, stiffness: 180 }}
    >
      {stats.map((s, i) => {
        const Icon = s.icon;
        return (
          <motion.div
            key={s.key}
            className="stat-card glass-card shimmer-border"
            initial={{ opacity: 0, y: 25 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 22, stiffness: 200, delay: i * 0.1 }}
            whileHover={{ y: -4 }}
          >
            <div className="stat-card-glow" style={{ background: s.glow }} />
            <div className="stat-card-content">
              <div className="stat-icon" style={{ background: s.bg }}>
                <Icon style={{ color: s.color }} />
              </div>
              <div>
                <p className="stat-label">{s.label}</p>
                <p className="stat-value">{s.format(metrics[s.key])}</p>
              </div>
            </div>
          </motion.div>
        );
      })}
    </motion.div>
  );
};

export default StatsRow;

import type { ReactNode } from 'react';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendPercent?: string;
  color?: string;
}

export default function StatsCard({
  title, value, subtitle, icon, trend, trendPercent, color = 'var(--primary)'
}: StatsCardProps) {
  return (
    <div
      className="glass"
      style={{
        padding: '20px 22px',
        transition: 'var(--transition)',
        cursor: 'default',
        animation: 'fadeIn 0.5s ease',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--border-primary)';
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3)';
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.transform = 'none';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{
          width: 40, height: 40, borderRadius: 10,
          background: `${color}20`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color,
        }}>
          {icon}
        </div>
        {trend && trendPercent && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 4,
            color: trend === 'up' ? 'var(--success)' : trend === 'down' ? 'var(--danger)' : 'var(--text-muted)',
            fontSize: 12, fontWeight: 600,
          }}>
            {trend === 'up' ? <TrendingUp size={14} /> : trend === 'down' ? <TrendingDown size={14} /> : null}
            {trendPercent}
          </div>
        )}
      </div>
      <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.5px', marginBottom: 4, color }}>
        {value}
      </div>
      <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: subtitle ? 2 : 0 }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{subtitle}</div>
      )}
    </div>
  );
}

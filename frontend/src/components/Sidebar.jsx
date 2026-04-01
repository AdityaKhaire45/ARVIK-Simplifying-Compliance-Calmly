import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileCheck, 
  Settings, 
  Bell, 
  PlusCircle,
  HelpCircle,
  ShieldCheck,
  Zap,
  Globe
} from 'lucide-react';

const Sidebar = ({ role, profile }) => {
  const menuItems = [
    { name: 'Workspace Dashboard', icon: <LayoutDashboard size={18} />, path: '/', shortcut: 'Ctrl+D', roles: ['admin', 'ca', 'client'] },
    { name: 'Entities & Clients', icon: <Users size={18} />, path: '/clients', shortcut: 'Ctrl+K', roles: ['admin', 'ca'] },
    { name: 'Regulatory Master', icon: <FileCheck size={18} />, path: '/compliances', roles: ['admin', 'ca', 'client'] },
    { name: 'Expert Consultant', icon: <ShieldCheck size={18} />, path: '/cas', roles: ['admin'] },
    { name: 'Security & Settings', icon: <Settings size={18} />, path: '/settings', roles: ['admin', 'ca', 'client'] },
  ];

  const filteredItems = menuItems.filter(item => !item.roles || item.roles.includes(role))

  return (
    <aside className="sidebar glass">
      <div className="sidebar-logo">
        <h1 style={{ 
          fontSize: '1.8rem', 
          fontWeight: 300, 
          letterSpacing: '0.1em',
          color: 'var(--primary-deep)',
          marginBottom: '5px'
        }}>
          ARVIK
        </h1>
        <p style={{ 
          fontSize: '0.65rem', 
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Simplifying Compliance, Calmly.
        </p>
      </div>

      <nav style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {filteredItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '12px 16px',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              color: 'var(--text-muted)',
              transition: 'all 0.2s ease',
              fontSize: '0.9rem',
              fontWeight: 500
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              {item.icon}
              {item.name}
            </div>
            {item.shortcut && <span className="shortcut-hint">{item.shortcut}</span>}
          </NavLink>
        ))}
      </nav>

      <div style={{ 
        marginTop: 'auto', 
        display: 'flex',
        flexDirection: 'column',
        gap: '4px'
      }}>
        {/* Realtime Status Indicator */}
        <div style={{ 
          padding: '16px', 
          background: 'var(--bg-main)', 
          borderRadius: '12px', 
          marginBottom: '20px',
          border: '1px solid var(--card-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 10px var(--primary)' }}></div>
            <span style={{ fontSize: '0.75rem', fontWeight: 600 }}>System Live</span>
          </div>
          <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', opacity: 0.8 }}>Secure Data Tunnel Established.</p>
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          padding: '12px',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          cursor: 'pointer'
        }}>
          <Zap size={18} color="var(--primary)" />
          Quick Actions
          <span className="shortcut-hint">Ctrl+/</span>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          padding: '12px',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          cursor: 'pointer'
        }}>
          <Globe size={18} />
          Regional Support
        </div>
      </div>

      <style>{`
        .sidebar-link:hover {
          background: rgba(61, 191, 193, 0.05);
          color: var(--primary);
        }
        .sidebar-link.active {
          background: var(--primary);
          color: white;
          box-shadow: 0 4px 12px rgba(61, 191, 193, 0.2);
        }
        .sidebar-link.active .shortcut-hint {
          color: rgba(255, 255, 255, 0.8);
          background: rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;

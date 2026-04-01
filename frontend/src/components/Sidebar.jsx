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
    { name: 'Workspace Dashboard', icon: <LayoutDashboard size={22} />, path: '/', shortcut: 'Ctrl+D', roles: ['admin', 'ca', 'client'] },
    { name: 'Entities & Clients', icon: <Users size={22} />, path: '/clients', shortcut: 'Ctrl+K', roles: ['admin', 'ca'] },
    { name: 'Regulatory Master', icon: <FileCheck size={22} />, path: '/compliances', roles: ['admin', 'ca', 'client'] },
    { name: 'Expert Consultant', icon: <ShieldCheck size={22} />, path: '/cas', roles: ['admin'] },
    { name: 'Security & Settings', icon: <Settings size={22} />, path: '/settings', roles: ['admin', 'ca', 'client'] },
  ];

  const filteredItems = menuItems.filter(item => !item.roles || item.roles.includes(role))

  return (
    <aside className="sidebar glass">
      <div className="sidebar-logo" style={{ textAlign: 'center', marginBottom: '20px' }}>
        <img 
          src="/logo.png" 
          alt="ARVIK Logo" 
          style={{ width: '80px', height: 'auto', marginBottom: '12px', filter: 'drop-shadow(0 4px 6px rgba(0,0,0,0.05))' }} 
        />
        <h1 style={{ 
          fontSize: '1.4rem', 
          fontWeight: 400, 
          letterSpacing: '0.15em',
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

      <nav style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filteredItems.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) => `sidebar-link ${isActive ? 'active' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderRadius: 'var(--radius-md)',
              textDecoration: 'none',
              color: 'var(--text-muted)',
              transition: 'all 0.3s ease',
              fontSize: '0.95rem',
              fontWeight: 600
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              {item.icon}
              {item.name}
            </div>
          </NavLink>
        ))}
      </nav>

      <div style={{ 
        marginTop: 'auto', 
        display: 'flex',
        flexDirection: 'column',
        gap: '8px'
      }}>
        {/* Realtime Status Indicator */}
        <div style={{ 
          padding: '24px', 
          background: 'rgba(61, 191, 193, 0.03)', 
          borderRadius: '16px', 
          marginBottom: '10px',
          border: '1px solid var(--card-border)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--primary)', boxShadow: '0 0 12px var(--primary)' }}></div>
            <span style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--primary-deep)' }}>Secure Node Live</span>
          </div>
          <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>Tunneling encrypted data via ARVIK Core Protocol.</p>
        </div>

        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          padding: '12px 18px',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
          cursor: 'pointer',
          fontWeight: 600
        }}>
          <Zap size={18} color="var(--primary)" />
          Quick Command
          <span className="shortcut-hint" style={{ marginLeft: 'auto' }}>Ctrl+/</span>
        </div>
      </div>

      <style>{`
        .sidebar-link:hover {
          background: rgba(61, 191, 193, 0.05);
          color: var(--primary);
          padding-left: 22px;
        }
        .sidebar-link.active {
          background: linear-gradient(135deg, var(--primary) 0%, var(--primary-deep) 100%);
          color: white;
          box-shadow: 0 8px 20px rgba(61, 191, 193, 0.2);
        }
      `}</style>
    </aside>
  );
};

export default Sidebar;

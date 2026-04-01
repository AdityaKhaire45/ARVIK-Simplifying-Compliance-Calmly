import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import useShortcuts from '../hooks/useShortcuts';
import { useNavigate } from 'react-router-dom';
import { auth, db, ref, onValue } from '../firebase';
import { LogOut, User as UserIcon, Bell, Search, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import MouseGlow from './MouseGlow';

const Layout = ({ children, role, user }) => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    if (user) {
      const userRef = ref(db, `users/${user.uid}`);
      onValue(userRef, (snap) => {
        setProfile(snap.val());
      });
    }
  }, [user]);

  const actions = {
    addClient: () => navigate('/clients'),
    searchClient: () => document.getElementById('global-search')?.focus(),
    saveForm: () => console.log('Global Save'),
    openDashboard: () => navigate('/'),
    openAlerts: () => console.log('Open Alerts'),
    switchTabs: (direction) => console.log(`Switch tabs ${direction}`)
  };

  useShortcuts(actions);

  return (
    <div className="app-container">
      <MouseGlow />
      <Sidebar role={role} profile={profile} />
      
      <main className="main-content" style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Top Navbar */}
        <header className="glass" style={{ 
          height: '70px', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          padding: '0 40px', 
          borderBottom: '1px solid var(--card-border)',
          position: 'sticky',
          top: 0,
          zIndex: 90,
          background: 'rgba(255, 255, 255, 0.4)',
          backdropFilter: 'blur(24px)'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', background: 'white', borderRadius: '14px', padding: '10px 18px', width: '400px', boxShadow: 'var(--shadow-soft)' }}>
            <Search size={18} color="var(--primary)" />
            <input 
              id="global-search"
              type="text" 
              placeholder="Workspace Index (Ctrl+K)" 
              style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', fontSize: '0.9rem', width: '100%', outline: 'none' }} 
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            <motion.div whileHover={{ scale: 1.1, rotate: 10 }} className="btn-ghost" style={{ padding: '8px', cursor: 'pointer', borderRadius: '10px', border: 'none' }}>
              <Bell size={20} color="var(--text-muted)" />
            </motion.div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', paddingLeft: '24px', borderLeft: '1px solid var(--card-border)' }}>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: '700', fontSize: '0.95rem' }}>{profile?.name || 'Authorized'}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--primary-deep)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{role} NODE</div>
              </div>
              <motion.div 
                whileHover={{ scale: 1.1, rotate: 5 }}
                style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'var(--primary)', display: 'grid', placeItems: 'center', color: 'white', fontWeight: 700, fontSize: '1.2rem', boxShadow: '0 6px 15px rgba(61,191,193,0.3)' }}
              >
                {profile?.name ? profile.name[0] : <UserIcon size={20} />}
              </motion.div>
              <button 
                onClick={() => auth.signOut().then(() => navigate('/login'))}
                className="btn btn-ghost" 
                style={{ padding: '8px', color: '#E68A8A', border: 'none' }}
                title="Log Out Securely"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        <section className="fade-in" style={{ padding: '40px' }}>
          {children}
        </section>
      </main>
    </div>
  );
};

export default Layout;

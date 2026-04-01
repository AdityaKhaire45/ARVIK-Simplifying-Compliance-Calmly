import React, { useState } from 'react';
import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  db,
  ref,
  set
} from '../firebase';
import { motion } from 'framer-motion';
import { Mail, Lock, User as UserIcon, Shield, Loader2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('client');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password);
        navigate('/');
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCred.user;
        
        // Save user profile in Realtime DB
        await set(ref(db, `users/${user.uid}`), {
          name,
          email,
          role,
          createdAt: new Date().toISOString()
        });
        
        navigate('/');
      }
    } catch (err) {
      setError(err.message.replace('Firebase:', ''));
    } finally {
      setLoading(false);
    }
  };

  const LogoSection = () => (
    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ marginBottom: '16px' }}
      >
        <img 
          src="/logo.png" 
          alt="ARVIK Logo" 
          style={{ width: '120px', height: 'auto', filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.1))' }} 
        />
      </motion.div>
      <h1 style={{ 
        fontSize: '1.8rem', 
        fontWeight: 400, 
        letterSpacing: '0.1em',
        color: 'var(--primary-deep)',
        marginBottom: '4px'
      }}>
        ARVIK
      </h1>
      <p style={{ 
        fontSize: '0.7rem', 
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
        letterSpacing: '0.08em'
      }}>
        Simplifying Compliance, Calmly.
      </p>
    </div>
  );

  return (
    <div style={{ 
      minHeight: '100vh', 
      display: 'grid', 
      placeItems: 'center',
      background: 'radial-gradient(circle at bottom left, var(--bg-accent) 0%, var(--bg-main) 50%)',
      padding: '20px'
    }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="card glass" 
        style={{ width: '100%', maxWidth: '420px', padding: '40px' }}
      >
        <LogoSection />

        <div style={{ display: 'flex', gap: '20px', marginBottom: '32px', borderBottom: '1px solid var(--card-border)' }}>
          <button 
            onClick={() => setIsLogin(true)}
            style={{ 
              padding: '12px 4px', 
              fontSize: '0.85rem', 
              fontWeight: 700,
              background: 'transparent',
              border: 'none',
              color: isLogin ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: `2.5px solid ${isLogin ? 'var(--primary)' : 'transparent'}`,
              cursor: 'pointer',
              flex: 1
            }}
          >
            Access Portal
          </button>
          <button 
            onClick={() => setIsLogin(false)}
            style={{ 
              padding: '12px 4px', 
              fontSize: '0.85rem', 
              fontWeight: 700,
              background: 'transparent',
              border: 'none',
              color: !isLogin ? 'var(--primary)' : 'var(--text-muted)',
              borderBottom: `2.5px solid ${!isLogin ? 'var(--primary)' : 'transparent'}`,
              cursor: 'pointer',
              flex: 1
            }}
          >
            Create Account
          </button>
        </div>

        <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {!isLogin && (
            <>
              <div style={{ position: 'relative' }}>
                <UserIcon size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                <input 
                  required
                  style={{ width: '100%', padding: '14px 14px 14px 44px', background: 'white', border: '1px solid var(--card-border)', borderRadius: '14px', outline: 'none' }}
                  placeholder="Full Name"
                  value={name} onChange={e => setName(e.target.value)}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <Shield size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
                <select 
                  style={{ width: '100%', padding: '14px 14px 14px 44px', background: 'white', border: '1px solid var(--card-border)', borderRadius: '14px', outline: 'none', appearance: 'none' }}
                  value={role} onChange={e => setRole(e.target.value)}
                >
                  <option value="client">Register as Client</option>
                  <option value="ca">Register as Expert (CA)</option>
                  <option value="admin">Administrator Support</option>
                </select>
              </div>
            </>
          )}

          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
            <input 
              required
              type="email"
              style={{ width: '100%', padding: '14px 14px 14px 44px', background: 'white', border: '1px solid var(--card-border)', borderRadius: '14px', outline: 'none' }}
              placeholder="Email Address"
              value={email} onChange={e => setEmail(e.target.value)}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '14px', top: '14px', color: 'var(--text-muted)' }} />
            <input 
              required
              type="password"
              style={{ width: '100%', padding: '14px 14px 14px 44px', background: 'white', border: '1px solid var(--card-border)', borderRadius: '14px', outline: 'none' }}
              placeholder="Security Password"
              value={password} onChange={e => setPassword(e.target.value)}
            />
          </div>

          {error && <div style={{ color: 'var(--danger)', fontSize: '0.8rem', textAlign: 'center', background: 'rgba(230,138,138,0.1)', padding: '10px', borderRadius: '10px', border: '1px solid rgba(230,138,138,0.2)' }}>{error}</div>}

          <button 
            disabled={loading}
            className="btn btn-primary" 
            style={{ marginTop: '12px', height: '54px', display: 'flex', justifyContent: 'center', gap: '12px', fontSize: '1rem' }}
          >
            {loading ? <Loader2 className="animate-spin" /> : (
          
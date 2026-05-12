'use client';

import { useState, useEffect } from 'react';
import { useData } from '@/context/DataContext';
import TeamManager from './TeamManager';
import FixtureManager from './FixtureManager';
import PdfImport from './PdfImport';

const ADMIN_PASSWORD = 'admin';

function AuthGate({ onAuth }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      sessionStorage.setItem('adminAuth', 'true');
      onAuth();
    } else {
      setError('Incorrect password');
      setPassword('');
    }
  };

  return (
    <div className="admin-login">
      <form className="admin-login-card" onSubmit={handleSubmit}>
        <h1>Admin Access</h1>
        <p>Enter the admin password to manage data.</p>
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setError(''); }}
          autoFocus
        />
        {error && <p className="admin-error">{error}</p>}
        <button type="submit" className="admin-btn" style={{ width: '100%' }}>Sign In</button>
      </form>
    </div>
  );
}

export default function AdminPage() {
  const { appData, updateAppData, resetToOriginal } = useData();
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState('teams');

  useEffect(() => {
    if (sessionStorage.getItem('adminAuth') === 'true') {
      setAuthed(true);
    }
  }, []);

  if (!authed) {
    return <AuthGate onAuth={() => setAuthed(true)} />;
  }

  const handleLogout = () => {
    sessionStorage.removeItem('adminAuth');
    setAuthed(false);
  };

  const tabs = [
    { id: 'teams', label: 'Teams' },
    { id: 'fixtures', label: 'Fixtures' },
    { id: 'results', label: 'Results' },
    { id: 'import', label: 'PDF Import' },
  ];

  return (
    <div className="admin-page">
      <div className="container" style={{ paddingTop: 32, paddingBottom: 48 }}>
        <div className="admin-header-bar">
          <h1>Admin Dashboard</h1>
          <div style={{ display: 'flex', gap: 10 }}>
            <button className="admin-btn-outline" onClick={resetToOriginal}>
              Reset All Data
            </button>
            <button className="admin-logout-btn" onClick={handleLogout}>
              Logout
            </button>
          </div>
        </div>

        <div className="admin-tabs">
          {tabs.map((t) => (
            <button
              key={t.id}
              className={`admin-tab ${tab === t.id ? 'active' : ''}`}
              onClick={() => setTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'teams' && <TeamManager appData={appData} updateAppData={updateAppData} />}
        {tab === 'fixtures' && <FixtureManager appData={appData} updateAppData={updateAppData} mode="fixtures" />}
        {tab === 'results' && <FixtureManager appData={appData} updateAppData={updateAppData} mode="results" />}
        {tab === 'import' && <PdfImport appData={appData} updateAppData={updateAppData} />}
      </div>
    </div>
  );
}

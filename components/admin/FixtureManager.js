'use client';

import { useState } from 'react';
import { formatDate, hasScore } from '@/components/competitionUtils';

function FixtureForm({ teams, pools, onSubmit, initial, onCancel }) {
  const [homeTeam, setHomeTeam] = useState(initial?.homeTeam ?? '');
  const [awayTeam, setAwayTeam] = useState(initial?.awayTeam ?? '');
  const [date, setDate] = useState(initial?.date ?? '');
  const [venue, setVenue] = useState(initial?.venue ?? '');
  const [pool, setPool] = useState(initial?.pool ?? '');

  const allTeamNames = teams;
  const poolOptions = pools ? pools.map((p) => p.name ?? `Pool ${p.id + 1}`) : [];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!homeTeam || !awayTeam || !date) return;
    onSubmit({ homeTeam, awayTeam, date, venue, pool });
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div className="admin-form-row">
        <label>
          Home Team
          <input list="home-list" value={homeTeam} onChange={(e) => setHomeTeam(e.target.value)} required />
          <datalist id="home-list">
            {allTeamNames.map((t) => <option key={t} value={t} />)}
          </datalist>
        </label>
        <label>
          Away Team
          <input list="away-list" value={awayTeam} onChange={(e) => setAwayTeam(e.target.value)} required />
          <datalist id="away-list">
            {allTeamNames.map((t) => <option key={t} value={t} />)}
          </datalist>
        </label>
      </div>
      <div className="admin-form-row">
        <label>
          Date
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label>
          Venue
          <input value={venue} onChange={(e) => setVenue(e.target.value)} placeholder="Optional" />
        </label>
      </div>
      {poolOptions.length > 0 && (
        <label>
          Pool
          <select value={pool} onChange={(e) => setPool(e.target.value)}>
            <option value="">No pool</option>
            {poolOptions.map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" className="admin-btn">
          {initial ? 'Update Fixture' : 'Add Fixture'}
        </button>
        {onCancel && (
          <button type="button" className="admin-btn-outline" onClick={onCancel}>Cancel</button>
        )}
      </div>
    </form>
  );
}

function ResultForm({ match, onSubmit }) {
  const [homeScore, setHomeScore] = useState(match.homeScore ?? '');
  const [awayScore, setAwayScore] = useState(match.awayScore ?? '');
  const [saving, setSaving] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    await onSubmit(match.id, homeScore, awayScore);
    setSaving(false);
    setDone(true);
    setTimeout(() => setDone(false), 2000);
  };

  return (
    <form className="admin-form" onSubmit={handleSubmit} style={{
      gridTemplateColumns: '1fr auto auto auto', alignItems: 'end', gap: 10, padding: 12,
    }}>
      <div style={{ fontWeight: 700, fontSize: '0.95rem' }}>
        {match.homeTeam} vs {match.awayTeam}
        <div style={{ fontWeight: 400, fontSize: '0.8rem', color: 'var(--muted)', marginTop: 2 }}>
          {formatDate(match.date)}{match.venue ? ` · ${match.venue}` : ''}
        </div>
      </div>
      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
        Home
        <input type="number" min="0" value={homeScore} onChange={(e) => setHomeScore(e.target.value)}
          style={{ width: 60, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 4 }} required />
      </label>
      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>
        Away
        <input type="number" min="0" value={awayScore} onChange={(e) => setAwayScore(e.target.value)}
          style={{ width: 60, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 4 }} required />
      </label>
      <button type="submit" className="admin-btn" disabled={saving} style={{ whiteSpace: 'nowrap' }}>
        {saving ? 'Saving...' : done ? 'Saved!' : 'Save'}
      </button>
    </form>
  );
}

function FixtureList({ fixtures, onDelete, onEdit, showResults, onResultSubmit, competition }) {
  if (fixtures.length === 0) {
    return <p className="empty-state">No {competition ? `${competition} ` : ''}fixtures yet.</p>;
  }

  return (
    <div className="admin-fixture-list">
      {fixtures.map((match, idx) => {
        const scored = hasScore(match);
        return (
          <div className="admin-fixture-item" key={match.id ?? idx}>
            <div className="fixture-info">
              <span className="fixture-teams">
                {match.homeTeam} vs {match.awayTeam}
                {scored && <span style={{ color: 'var(--primary)', marginLeft: 8 }}>
                  {match.homeScore} - {match.awayScore}
                </span>}
              </span>
              <span className="fixture-meta">
                {formatDate(match.date)}{match.venue ? ` · ${match.venue}` : ''}
                {match.pool ? ` · ${match.pool}` : ''}
              </span>
            </div>
            <div className="admin-list-actions">
              {showResults && !scored && (
                <button className="admin-small-btn" style={{ background: 'var(--primary)', color: '#fff' }}
                  onClick={() => onResultSubmit(match)}>
                  Score
                </button>
              )}
              {onEdit && (
                <button className="admin-small-btn" style={{ background: 'var(--surface-soft)', color: 'var(--foreground)' }}
                  onClick={() => onEdit(match)}>
                  Edit
                </button>
              )}
              <button className="admin-small-btn admin-btn-danger" onClick={() => onDelete(match.id ?? idx)}>
                Delete
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function FixtureManager({ appData, updateAppData, mode }) {
  const { leagueData, leagueMatches, cupPools, shieldPools, cupMatches, shieldMatches } = appData;

  const allTeamNames = [];
  leagueData.divisions.forEach((div) => {
    (div.teams ?? []).forEach((t) => {
      const n = t.name ?? t;
      if (!allTeamNames.includes(n)) allTeamNames.push(n);
    });
  });
  (cupPools ?? []).forEach((p) => (p.teams ?? []).forEach((t) => {
    const n = t.name ?? t;
    if (!allTeamNames.includes(n)) allTeamNames.push(n);
  }));
  (shieldPools ?? []).forEach((p) => (p.teams ?? []).forEach((t) => {
    const n = t.name ?? t;
    if (!allTeamNames.includes(n)) allTeamNames.push(n);
  }));

  const [activeSection, setActiveSection] = useState('league');
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const generateId = () => Date.now() + Math.random();

  const handleCreate = (data) => {
    const fixture = { id: generateId(), ...data, homeScore: undefined, awayScore: undefined };
    const key = activeSection === 'league' ? 'leagueMatches'
      : activeSection === 'cup' ? 'cupMatches' : 'shieldMatches';
    updateAppData({ ...appData, [key]: [...(appData[key] ?? []), fixture] });
    setShowForm(false);
  };

  const handleDelete = (id) => {
    const key = activeSection === 'league' ? 'leagueMatches'
      : activeSection === 'cup' ? 'cupMatches' : 'shieldMatches';
    updateAppData({ ...appData, [key]: (appData[key] ?? []).filter((m) => m.id !== id) });
  };

  const handleEdit = (match) => {
    setEditing(match);
    setShowForm(true);
  };

  const handleUpdate = (data) => {
    const key = activeSection === 'league' ? 'leagueMatches'
      : activeSection === 'cup' ? 'cupMatches' : 'shieldMatches';
    updateAppData({
      ...appData,
      [key]: (appData[key] ?? []).map((m) =>
        m.id === editing.id ? { ...m, ...data } : m
      ),
    });
    setEditing(null);
    setShowForm(false);
  };

  const handleResultSubmit = async (id, homeScore, awayScore) => {
    const key = activeSection === 'league' ? 'leagueMatches'
      : activeSection === 'cup' ? 'cupMatches' : 'shieldMatches';
    updateAppData({
      ...appData,
      [key]: (appData[key] ?? []).map((m) =>
        m.id === id ? { ...m, homeScore: Number(homeScore), awayScore: Number(awayScore) } : m
      ),
    });
  };

  const sections = [
    { id: 'league', label: 'League', matches: leagueMatches },
    { id: 'cup', label: 'Cup Division', matches: cupMatches, pools: cupPools },
    { id: 'shield', label: 'Shield Division', matches: shieldMatches, pools: shieldPools },
  ];

  const current = sections.find((s) => s.id === activeSection);
  const matches = current?.matches ?? [];
  const pools = current?.pools;

  const upcoming = matches.filter((m) => !hasScore(m));
  const completed = matches.filter(hasScore);

  return (
    <div>
      <div className="admin-tabs" style={{ marginBottom: 20 }}>
        {sections.map((s) => (
          <button
            key={s.id}
            className={`admin-tab ${activeSection === s.id ? 'active' : ''}`}
            onClick={() => { setActiveSection(s.id); setShowForm(false); setEditing(null); }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {mode === 'fixtures' && (
        <>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
            {!showForm && <button className="admin-btn" onClick={() => { setShowForm(true); setEditing(null); }}>
              + Add Fixture
            </button>}
          </div>

          {showForm && (
            <FixtureForm
              teams={allTeamNames}
              pools={pools}
              initial={editing}
              onSubmit={editing ? handleUpdate : handleCreate}
              onCancel={() => { setShowForm(false); setEditing(null); }}
            />
          )}

          <div className="admin-section">
            <h3>Upcoming {current.label} Fixtures ({upcoming.length})</h3>
            <FixtureList
              fixtures={upcoming}
              onDelete={handleDelete}
              onEdit={handleEdit}
            />
          </div>

          {completed.length > 0 && (
            <div className="admin-section">
              <h3>Completed {current.label} Fixtures ({completed.length})</h3>
              <FixtureList
                fixtures={completed}
                onDelete={handleDelete}
                onEdit={handleEdit}
              />
            </div>
          )}
        </>
      )}

      {mode === 'results' && (
        <>
          <div className="admin-section">
            <h3>Unscored Fixtures ({upcoming.length})</h3>
            {upcoming.length === 0 ? (
              <p className="empty-state">All fixtures have scores entered.</p>
            ) : (
              upcoming.map((match, idx) => (
                <ResultForm key={match.id ?? idx} match={match} onSubmit={handleResultSubmit} />
              ))
            )}
          </div>

          <div className="admin-section">
            <h3>Completed Results ({completed.length})</h3>
            {completed.length === 0 ? (
              <p className="empty-state">No completed results yet.</p>
            ) : (
              completed.map((match, idx) => (
                <div key={match.id ?? idx} className="admin-fixture-item" style={{
                  background: 'var(--surface-soft)', opacity: 0.8,
                }}>
                  <div className="fixture-info">
                    <span className="fixture-teams">
                      {match.homeTeam} <strong>{match.homeScore}</strong> - <strong>{match.awayScore}</strong> {match.awayTeam}
                    </span>
                    <span className="fixture-meta">
                      {formatDate(match.date)}{match.venue ? ` · ${match.venue}` : ''}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

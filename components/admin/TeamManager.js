'use client';

import { useState } from 'react';

function DivisionManager({ divisions, onUpdate }) {
  const [newName, setNewName] = useState('');
  const [adding, setAdding] = useState(false);

  const addDivision = () => {
    if (!newName.trim()) return;
    const nextId = Math.max(0, ...divisions.map((d) => d.id)) + 1;
    onUpdate([...divisions, { id: nextId, name: newName.trim(), teams: [] }]);
    setNewName('');
  };

  const removeDivision = (id) => {
    onUpdate(divisions.filter((d) => d.id !== id));
  };

  return (
    <div className="admin-section">
      <h3>Divisions</h3>
      {!adding ? (
        <button className="admin-btn" onClick={() => setAdding(true)}>+ Add Division</button>
      ) : (
        <div className="admin-form" style={{ gridTemplateColumns: '1fr auto', display: 'grid', gap: 8 }}>
          <input
            placeholder="Division name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && addDivision()}
          />
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="admin-btn" onClick={addDivision}>Add</button>
            <button className="admin-btn-outline" onClick={() => { setAdding(false); setNewName(''); }}>Cancel</button>
          </div>
        </div>
      )}
      <div className="admin-list" style={{ marginTop: 12 }}>
        {divisions.map((div) => (
          <div className="admin-list-item" key={div.id}>
            <span>{div.name} <span style={{ color: 'var(--muted)', fontWeight: 400 }}>({div.teams.length} teams)</span></span>
            <button className="admin-small-btn admin-btn-danger" onClick={() => removeDivision(div.id)}>
              Remove
            </button>
          </div>
        ))}
        {divisions.length === 0 && <p className="empty-state">No divisions yet.</p>}
      </div>
    </div>
  );
}

function TeamList({ teams, label, onAdd, onRemove }) {
  const [newTeam, setNewTeam] = useState('');

  const handleAdd = () => {
    if (!newTeam.trim()) return;
    onAdd(newTeam.trim());
    setNewTeam('');
  };

  return (
    <div>
      <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
        <input
          placeholder={`Add ${label} team...`}
          value={newTeam}
          onChange={(e) => setNewTeam(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          style={{
            flex: 1, padding: '8px 12px', border: '1px solid var(--border)',
            borderRadius: 6, background: 'var(--background)', color: 'var(--foreground)',
            fontSize: '0.9rem',
          }}
        />
        <button className="admin-btn" onClick={handleAdd}>Add</button>
      </div>
      {teams.length > 0 ? (
        <div className="admin-list">
          {teams.map((team, i) => (
            <div className="admin-list-item" key={team.name ?? i}>
              <span>{team.name ?? team}</span>
              <button className="admin-small-btn admin-btn-danger" onClick={() => onRemove(i)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-state">No teams in {label}.</p>
      )}
    </div>
  );
}

function PoolManager({ pools, label, allTeams, onUpdate }) {
  const [newPoolName, setNewPoolName] = useState('');

  const addPool = () => {
    if (!newPoolName.trim()) return;
    const nextId = Math.max(0, ...pools.map((p) => (typeof p.id === 'number' ? p.id : 0))) + 1;
    onUpdate([...pools, { id: nextId, name: newPoolName.trim(), teams: [] }]);
    setNewPoolName('');
  };

  const removePool = (poolId) => {
    onUpdate(pools.filter((p) => (p.id ?? p) !== poolId));
  };

  const addTeamToPool = (poolId, teamName) => {
    onUpdate(
      pools.map((p) =>
        (p.id ?? p) === poolId
          ? { ...p, teams: [...(p.teams ?? []), { name: teamName }] }
          : p
      )
    );
  };

  const removeTeamFromPool = (poolId, teamIdx) => {
    onUpdate(
      pools.map((p) =>
        (p.id ?? p) === poolId
          ? { ...p, teams: (p.teams ?? []).filter((_, i) => i !== teamIdx) }
          : p
      )
    );
  };

  return (
    <div className="admin-section">
      <h3>{label} Pools</h3>
      <div className="admin-form" style={{ gridTemplateColumns: '1fr auto', display: 'grid', gap: 8 }}>
        <input
          placeholder="New pool name"
          value={newPoolName}
          onChange={(e) => setNewPoolName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && addPool()}
        />
        <button className="admin-btn" onClick={addPool}>+ Add Pool</button>
      </div>

      {pools.length === 0 ? (
        <p className="empty-state">No pools configured.</p>
      ) : (
        pools.map((pool) => {
          const poolId = pool.id ?? pool;
          const poolName = pool.name ?? `Pool ${poolId + 1}`;
          const teams = pool.teams ?? [];

          return (
            <div key={poolId} style={{
              border: '1px solid var(--border)', borderRadius: 8,
              padding: 16, marginTop: 12, background: 'var(--surface)',
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <strong style={{ color: 'var(--primary)' }}>{poolName}</strong>
                <button className="admin-small-btn admin-btn-danger" onClick={() => removePool(poolId)}>
                  Remove Pool
                </button>
              </div>
              <TeamList
                teams={teams}
                label={poolName}
                onAdd={(name) => addTeamToPool(poolId, name)}
                onRemove={(i) => removeTeamFromPool(poolId, i)}
              />
            </div>
          );
        })
      )}
    </div>
  );
}

export default function TeamManager({ appData, updateAppData }) {
  const { leagueData, cupPools, shieldPools } = appData;

  const updateDivisions = (divisions) => {
    updateAppData({ ...appData, leagueData: { ...leagueData, divisions } });
  };

  const updateCupPools = (pools) => {
    updateAppData({ ...appData, cupPools: pools });
  };

  const updateShieldPools = (pools) => {
    updateAppData({ ...appData, shieldPools: pools });
  };

  const addTeamToDivision = (divId, teamName) => {
    updateAppData({
      ...appData,
      leagueData: {
        ...leagueData,
        divisions: leagueData.divisions.map((div) =>
          div.id === divId
            ? { ...div, teams: [...div.teams, { name: teamName }] }
            : div
        ),
      },
    });
  };

  const removeTeamFromDivision = (divId, teamIdx) => {
    updateAppData({
      ...appData,
      leagueData: {
        ...leagueData,
        divisions: leagueData.divisions.map((div) =>
          div.id === divId
            ? { ...div, teams: div.teams.filter((_, i) => i !== teamIdx) }
            : div
        ),
      },
    });
  };

  const allTeams = [];
  leagueData.divisions.forEach((div) => {
    (div.teams ?? []).forEach((t) => {
      const n = t.name ?? t;
      if (!allTeams.includes(n)) allTeams.push(n);
    });
  });

  return (
    <div>
      <DivisionManager divisions={leagueData.divisions} onUpdate={updateDivisions} />

      {leagueData.divisions.map((div) => {
        const label = div.name || `Division ${div.id}`;
        return (
          <div className="admin-section" key={div.id} style={{
            border: '1px solid var(--border)', borderRadius: 8, padding: 16,
            background: 'var(--surface)',
          }}>
            <h3 style={{ margin: '0 0 12px', color: 'var(--primary-dark)' }}>{label} Teams</h3>
            <TeamList
              teams={div.teams ?? []}
              label={label}
              onAdd={(name) => addTeamToDivision(div.id, name)}
              onRemove={(i) => removeTeamFromDivision(div.id, i)}
            />
          </div>
        );
      })}

      <div style={{ marginTop: 32 }}>
        <PoolManager pools={cupPools} label="Cup Division" allTeams={allTeams} onUpdate={updateCupPools} />
        <PoolManager pools={shieldPools} label="Shield Division" allTeams={allTeams} onUpdate={updateShieldPools} />
      </div>
    </div>
  );
}

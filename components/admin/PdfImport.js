'use client';

import { useState } from 'react';

const dateRegex = /(\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4})/i;
const dateDashRegex = /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/;
const vsRegex = /\b(.+?)\s+v(?:s\.?|ersus)\s+(.+)\b/i;
const venueKeywords = ['stadium', 'ground', 'park', 'field', 'venue', 'oval', 'sports club', 'rugby club', 'complex', 'st', 'st.'];

const skipLines = ['fixtures', 'results', 'round', 'kickoff', 'time', 'referee', 'page'];

function isSectionHeader(line) {
  const l = line.toLowerCase();
  if (/^(league|cup|shield)/i.test(l) && (/\b(competition|division)\b/i.test(l) || l === 'league' || l === 'cup' || l === 'shield')) return true;
  if (/^(sibanye|super league)/i.test(l)) return true;
  return false;
}

function isDivisionHeader(line) {
  return /^division\s+\w+/i.test(line) || /^(premier|first|second|third)\s+division/i.test(line);
}

function isPoolHeader(line) {
  return /^pool\s+[a-z0-9]/i.test(line) || /^(group|section)\s+[a-z0-9]/i.test(line);
}

function isDateOrVenue(line) {
  if (dateRegex.test(line) || dateDashRegex.test(line)) return true;
  if (venueKeywords.some((kw) => line.toLowerCase().includes(kw))) return true;
  if (/^\d{1,2}:\d{2}/.test(line)) return true;
  return false;
}

function isFixtureLine(line) {
  return vsRegex.test(line);
}

function isTeamLine(line, knownSections) {
  const l = line.toLowerCase();
  if (skipLines.some((kw) => l.startsWith(kw) || l === kw)) return false;
  if (l.length < 2) return false;
  if (/^\d+$/.test(line)) return false;
  if (knownSections.some((s) => l.startsWith(s.toLowerCase()))) return false;
  return true;
}

function parsePdfText(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);

  const result = {
    leagueDivisions: [],
    cupPools: [],
    shieldPools: [],
    fixtures: [],
    unknownTeams: [],
  };

  let currentSection = null;
  let currentDivision = null;
  let currentPool = null;
  let currentDate = '';
  let currentVenue = '';

  const sectionMap = {
    league: 'league',
    cup: 'cup',
    shield: 'shield',
  };

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+/g, ' ');

    if (isSectionHeader(line)) {
      const l = line.toLowerCase();
      if (/\bleague\b/i.test(l) && !/\b(cup|shield)\b/i.test(l)) {
        currentSection = 'league';
      } else if (/\bcup\b/i.test(l)) {
        currentSection = 'cup';
      } else if (/\bshield\b/i.test(l)) {
        currentSection = 'shield';
      } else if (/super\s+league/i.test(l) && !/cup|shield/.test(l)) {
        currentSection = 'league';
      }
      currentDivision = null;
      currentPool = null;
      currentDate = '';
      currentVenue = '';
      continue;
    }

    if (currentSection === 'league' && isDivisionHeader(line)) {
      const match = line.match(/^division\s+(.+)/i) || line.match(/^(.+)\s+division/i);
      const name = match ? match[1].trim() : line;
      currentDivision = name;
      currentPool = null;
      if (!result.leagueDivisions.find((d) => d.name === name)) {
        result.leagueDivisions.push({ name, teams: [] });
      }
      continue;
    }

    if ((currentSection === 'cup' || currentSection === 'shield') && isPoolHeader(line)) {
      const match = line.match(/^(?:pool|group|section)\s+(.+)/i);
      const name = match ? match[1].trim().toUpperCase() : line;
      currentPool = name;
      const target = currentSection === 'cup' ? result.cupPools : result.shieldPools;
      if (!target.find((p) => p.name === name)) {
        target.push({ name, teams: [] });
      }
      continue;
    }

    if (isDateOrVenue(line)) {
      const dateMatch = line.match(dateRegex) || line.match(dateDashRegex);
      if (dateMatch) currentDate = dateMatch[1];

      if (venueKeywords.some((kw) => line.toLowerCase().includes(kw))) {
        const vsCheck = line.match(vsRegex);
        if (!vsCheck) currentVenue = line;
      }
      continue;
    }

    if (isFixtureLine(line)) {
      const vsMatch = line.match(vsRegex);
      if (vsMatch) {
        const homeTeam = vsMatch[1].trim().replace(/^\d+\s*/, '').replace(/\s*\d+$/, '');
        const awayTeam = vsMatch[2].trim().replace(/^\d+\s*/, '').replace(/\s*\d+$/, '');

        let pool = '';
        const poolMatch = line.match(/\(([^)]+)\)/);
        if (poolMatch) pool = poolMatch[1];

        result.fixtures.push({
          homeTeam,
          awayTeam,
          date: currentDate,
          venue: currentVenue,
          section: currentSection,
          pool: pool || (currentSection !== 'league' ? currentPool : '') || '',
          division: currentSection === 'league' ? currentDivision : '',
        });
      }
      continue;
    }

    if (isTeamLine(line, ['league', 'cup', 'shield', 'division', 'pool'])) {
      if (currentSection === 'league' && currentDivision) {
        const div = result.leagueDivisions.find((d) => d.name === currentDivision);
        if (div && !div.teams.includes(line)) div.teams.push(line);
      } else if (currentSection === 'cup' && currentPool) {
        const pool = result.cupPools.find((p) => p.name === currentPool);
        if (pool && !pool.teams.includes(line)) pool.teams.push(line);
      } else if (currentSection === 'shield' && currentPool) {
        const pool = result.shieldPools.find((p) => p.name === currentPool);
        if (pool && !pool.teams.includes(line)) pool.teams.push(line);
      } else {
        if (!result.unknownTeams.includes(line)) result.unknownTeams.push(line);
      }
    }
  }

  return result;
}

function normalizeDate(raw) {
  if (!raw) return '';
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(raw)) return raw.replace(/\//g, '-');
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) return d.toISOString().split('T')[0];
  return raw;
}

export default function PdfImport({ appData, updateAppData }) {
  const [parsing, setParsing] = useState(false);
  const [parsed, setParsed] = useState(null);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [importTeams, setImportTeams] = useState(true);
  const [importFixtures, setImportFixtures] = useState(true);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file.');
      return;
    }

    setParsing(true);
    setError('');
    setParsed(null);
    setStatus('Reading PDF...');

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs';

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map((item) => item.str).join(' ') + '\n';
      }

      const parsedData = parsePdfText(fullText);
      const totalDivisions = parsedData.leagueDivisions.length;
      const totalPools = parsedData.cupPools.length + parsedData.shieldPools.length;
      const totalTeams = parsedData.leagueDivisions.reduce((s, d) => s + d.teams.length, 0)
        + parsedData.cupPools.reduce((s, p) => s + p.teams.length, 0)
        + parsedData.shieldPools.reduce((s, p) => s + p.teams.length, 0)
        + parsedData.unknownTeams.length;
      const totalFixtures = parsedData.fixtures.length;

      if (totalTeams === 0 && totalFixtures === 0) {
        setError('No teams or fixtures found. Check that the PDF contains team names or "Team A vs Team B" patterns.');
        setParsing(false);
        return;
      }

      setParsed(parsedData);
      const parts = [];
      if (totalDivisions > 0) parts.push(`${totalDivisions} division(s)`);
      if (totalPools > 0) parts.push(`${totalPools} pool(s)`);
      if (totalTeams > 0) parts.push(`${totalTeams} team(s)`);
      if (totalFixtures > 0) parts.push(`${totalFixtures} fixture(s)`);
      setStatus(`Found ${parts.join(', ')}. Review and confirm below.`);
    } catch (err) {
      setError('Failed to parse PDF: ' + err.message);
    } finally {
      setParsing(false);
    }
  };

  const clearParsed = () => {
    setParsed(null);
    setStatus('');
    setError('');
  };

  const confirmImport = () => {
    if (!parsed) return;

    const { leagueDivisions, cupPools, shieldPools, fixtures } = parsed;
    const updated = { ...appData };

    if (importTeams) {
      if (leagueDivisions.length > 0) {
        const existingDivs = updated.leagueData?.divisions ?? [];
        const mergedDivs = [...existingDivs];

        for (const newDiv of leagueDivisions) {
          const existing = mergedDivs.find((d) => d.name === newDiv.name);
          if (existing) {
            const existingNames = new Set((existing.teams ?? []).map((t) => t.name ?? t));
            for (const t of newDiv.teams) {
              if (!existingNames.has(t)) {
                existing.teams = [...(existing.teams ?? []), { name: t }];
                existingNames.add(t);
              }
            }
          } else {
            const nextId = Math.max(0, ...mergedDivs.map((d) => d.id)) + 1;
            mergedDivs.push({ id: nextId, name: newDiv.name, teams: newDiv.teams.map((t) => ({ name: t })) });
          }
        }

        updated.leagueData = { ...(updated.leagueData ?? {}), divisions: mergedDivs };
      }

      if (cupPools.length > 0) {
        const existing = updated.cupPools ?? [];
        const merged = [...existing];

        for (const newPool of cupPools) {
          const existingPool = merged.find((p) => p.name === newPool.name);
          if (existingPool) {
            const existingNames = new Set((existingPool.teams ?? []).map((t) => t.name ?? t));
            for (const t of newPool.teams) {
              if (!existingNames.has(t)) {
                existingPool.teams = [...(existingPool.teams ?? []), { name: t }];
                existingNames.add(t);
              }
            }
          } else {
            const nextId = Math.max(0, ...merged.map((p) => (typeof p.id === 'number' ? p.id : 0))) + 1;
            merged.push({ id: nextId, name: newPool.name, teams: newPool.teams.map((t) => ({ name: t })) });
          }
        }

        updated.cupPools = merged;
      }

      if (shieldPools.length > 0) {
        const existing = updated.shieldPools ?? [];
        const merged = [...existing];

        for (const newPool of shieldPools) {
          const existingPool = merged.find((p) => p.name === newPool.name);
          if (existingPool) {
            const existingNames = new Set((existingPool.teams ?? []).map((t) => t.name ?? t));
            for (const t of newPool.teams) {
              if (!existingNames.has(t)) {
                existingPool.teams = [...(existingPool.teams ?? []), { name: t }];
                existingNames.add(t);
              }
            }
          } else {
            const nextId = Math.max(0, ...merged.map((p) => (typeof p.id === 'number' ? p.id : 0))) + 1;
            merged.push({ id: nextId, name: newPool.name, teams: newPool.teams.map((t) => ({ name: t })) });
          }
        }

        updated.shieldPools = merged;
      }
    }

    if (importFixtures && fixtures.length > 0) {
      const leagueFixtures = fixtures.filter((f) => f.section === 'league');
      const cupFixtures = fixtures.filter((f) => f.section === 'cup');
      const shieldFixtures = fixtures.filter((f) => f.section === 'shield');
      const uncategorizedFixtures = fixtures.filter((f) => !f.section);

      const toFixture = (f) => ({
        id: Date.now() + Math.random(),
        homeTeam: f.homeTeam,
        awayTeam: f.awayTeam,
        date: normalizeDate(f.date),
        venue: f.venue,
        pool: f.pool || undefined,
      });

      if (leagueFixtures.length > 0) {
        updated.leagueMatches = [...(updated.leagueMatches ?? []), ...leagueFixtures.map(toFixture)];
      }
      if (cupFixtures.length > 0) {
        updated.cupMatches = [...(updated.cupMatches ?? []), ...cupFixtures.map(toFixture)];
      }
      if (shieldFixtures.length > 0) {
        updated.shieldMatches = [...(updated.shieldMatches ?? []), ...shieldFixtures.map(toFixture)];
      }
      if (uncategorizedFixtures.length > 0) {
        updated.cupMatches = [...(updated.cupMatches ?? []), ...uncategorizedFixtures.map(toFixture)];
      }
    }

    updateAppData(updated);
    setStatus('Import complete! Data has been saved.');
    setParsed(null);
  };

  const removeDivision = (idx) => {
    const p = { ...parsed, leagueDivisions: parsed.leagueDivisions.filter((_, i) => i !== idx) };
    setParsed(p);
  };

  const removePool = (target, idx) => {
    const key = target === 'cup' ? 'cupPools' : 'shieldPools';
    const p = { ...parsed, [key]: parsed[key].filter((_, i) => i !== idx) };
    setParsed(p);
  };

  const removeFixture = (idx) => {
    const p = { ...parsed, fixtures: parsed.fixtures.filter((_, i) => i !== idx) };
    setParsed(p);
  };

  const hasContent = parsed && (
    parsed.leagueDivisions.length > 0
    || parsed.cupPools.length > 0
    || parsed.shieldPools.length > 0
    || parsed.fixtures.length > 0
    || parsed.unknownTeams.length > 0
  );

  return (
    <div>
      <div className="admin-section">
        <h3>Import from PDF</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 16, lineHeight: 1.5 }}>
          Upload a PDF containing league structures, teams, and fixtures. The parser detects sections
          like <strong>Division 1</strong>, <strong>Pool A</strong>, <strong>Cup/Shield Division</strong>,
          and lines with <strong>Team vs Team</strong>.
        </p>

        <div className="admin-form">
          <label style={{ border: '2px dashed var(--border)', borderRadius: 8, padding: 32, textAlign: 'center', cursor: 'pointer' }}>
            <input type="file" accept="application/pdf" onChange={handleFile} style={{ display: 'none' }} />
            <span style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '1.1rem' }}>
              {parsing ? 'Parsing PDF...' : 'Click to select a PDF file'}
            </span>
          </label>
        </div>

        {error && <p className="admin-error">{error}</p>}
        {status && <p className="admin-success">{status}</p>}
      </div>

      {hasContent && (
        <div className="admin-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Preview</h3>
            <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                <input type="checkbox" checked={importTeams} onChange={(e) => setImportTeams(e.target.checked)} />
                Teams
              </label>
              <label style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: '0.85rem', fontWeight: 600, cursor: 'pointer' }}>
                <input type="checkbox" checked={importFixtures} onChange={(e) => setImportFixtures(e.target.checked)} />
                Fixtures
              </label>
            </div>
          </div>

          {/* League Divisions */}
          {parsed.leagueDivisions.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ color: 'var(--primary-dark)', fontWeight: 800, margin: '0 0 10px' }}>League Divisions</h4>
              {parsed.leagueDivisions.map((div, i) => (
                <div key={i} className="admin-fixture-item" style={{ marginBottom: 6 }}>
                  <div className="fixture-info">
                    <span className="fixture-teams" style={{ color: 'var(--primary)' }}>{div.name}</span>
                    <span className="fixture-meta">{div.teams.length} team(s): {div.teams.join(', ') || 'none'}</span>
                  </div>
                  <button className="admin-small-btn admin-btn-danger" onClick={() => removeDivision(i)}>Remove</button>
                </div>
              ))}
            </div>
          )}

          {/* Cup Pools */}
          {parsed.cupPools.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ color: 'var(--primary-dark)', fontWeight: 800, margin: '0 0 10px' }}>Cup Division Pools</h4>
              {parsed.cupPools.map((pool, i) => (
                <div key={i} className="admin-fixture-item" style={{ marginBottom: 6 }}>
                  <div className="fixture-info">
                    <span className="fixture-teams" style={{ color: 'var(--primary)' }}>{pool.name}</span>
                    <span className="fixture-meta">{pool.teams.length} team(s): {pool.teams.join(', ') || 'none'}</span>
                  </div>
                  <button className="admin-small-btn admin-btn-danger" onClick={() => removePool('cup', i)}>Remove</button>
                </div>
              ))}
            </div>
          )}

          {/* Shield Pools */}
          {parsed.shieldPools.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ color: 'var(--primary-dark)', fontWeight: 800, margin: '0 0 10px' }}>Shield Division Pools</h4>
              {parsed.shieldPools.map((pool, i) => (
                <div key={i} className="admin-fixture-item" style={{ marginBottom: 6 }}>
                  <div className="fixture-info">
                    <span className="fixture-teams" style={{ color: 'var(--primary)' }}>{pool.name}</span>
                    <span className="fixture-meta">{pool.teams.length} team(s): {pool.teams.join(', ') || 'none'}</span>
                  </div>
                  <button className="admin-small-btn admin-btn-danger" onClick={() => removePool('shield', i)}>Remove</button>
                </div>
              ))}
            </div>
          )}

          {/* Unknown teams (not sorted into section) */}
          {parsed.unknownTeams.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ color: 'var(--muted)', fontWeight: 800, margin: '0 0 10px' }}>Uncategorized Teams</h4>
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginBottom: 8 }}>
                These teams were found but could not be placed into a specific division or pool.
              </p>
              <div className="admin-list">
                {parsed.unknownTeams.map((team, i) => (
                  <div key={i} className="admin-list-item">
                    <span>{team}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Fixtures */}
          {parsed.fixtures.length > 0 && (
            <div style={{ marginBottom: 20 }}>
              <h4 style={{ color: 'var(--primary-dark)', fontWeight: 800, margin: '0 0 10px' }}>
                Fixtures ({parsed.fixtures.length})
              </h4>
              <div className="admin-fixture-list">
                {parsed.fixtures.map((f, i) => (
                  <div className="admin-fixture-item" key={i}>
                    <div className="fixture-info">
                      <span className="fixture-teams">{f.homeTeam} vs {f.awayTeam}</span>
                      <span className="fixture-meta">
                        {f.date || 'Date TBC'}{f.venue ? ` · ${f.venue}` : ''}
                        {f.section ? ` · ${f.section === 'league' ? 'League' : f.section === 'cup' ? 'Cup' : 'Shield'}` : ''}
                        {f.pool ? ` · ${f.pool}` : ''}
                        {f.division ? ` · ${f.division}` : ''}
                      </span>
                    </div>
                    <button className="admin-small-btn admin-btn-danger" onClick={() => removeFixture(i)}>Remove</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
            <button className="admin-btn" onClick={confirmImport}
              disabled={!importTeams && !importFixtures}>
              Confirm Import
            </button>
            <button className="admin-btn-outline" onClick={clearParsed}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

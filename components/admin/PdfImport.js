'use client';

import { useState } from 'react';

function extractFixtures(text) {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const fixtures = [];
  let currentDate = '';
  let currentVenue = '';

  const dateRegex = /(\d{1,2}\s+(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{4})/i;
  const dateDashRegex = /(\d{4}[-/]\d{1,2}[-/]\d{1,2})/;
  const vsRegex = /\b(.+?)\s+v(?:s\.?|ersus)\s+(.+)\b/i;
  const venueKeywords = ['stadium', 'ground', 'park', 'field', 'venue', 'oval', 'sports club', 'rugby club', 'complex'];

  for (const line of lines) {
    const dateMatch = line.match(dateRegex) || line.match(dateDashRegex);
    if (dateMatch) {
      currentDate = dateMatch[1];
    }

    const isVenue = venueKeywords.some((kw) => line.toLowerCase().includes(kw));
    if (isVenue && !line.match(vsRegex)) {
      currentVenue = line;
      continue;
    }

    const vsMatch = line.match(vsRegex);
    if (vsMatch) {
      const homeTeam = vsMatch[1].trim();
      const awayTeam = vsMatch[2].trim();
      let pool = '';

      const poolMatch = line.match(/\(([^)]+)\)/);
      if (poolMatch) pool = poolMatch[1];

      fixtures.push({
        homeTeam: homeTeam.replace(/^\d+\s*/, ''),
        awayTeam: awayTeam.replace(/\s*\d+$/, ''),
        date: currentDate,
        venue: currentVenue,
        pool,
      });
    }
  }

  return fixtures;
}

function normalizeDate(raw) {
  if (!raw) return '';
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(raw)) {
    return raw.replace(/\//g, '-');
  }
  const d = new Date(raw);
  if (!Number.isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return raw;
}

export default function PdfImport({ appData, updateAppData }) {
  const [parsing, setParsing] = useState(false);
  const [preview, setPreview] = useState(null);
  const [error, setError] = useState('');
  const [target, setTarget] = useState('cup');
  const [status, setStatus] = useState('');

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setError('Please select a PDF file.');
      return;
    }

    setParsing(true);
    setError('');
    setPreview(null);
    setStatus('Reading PDF...');

    try {
      const pdfjsLib = await import('pdfjs-dist');
      pdfjsLib.GlobalWorkerOptions.workerSrc =
        `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;

      const arrayBuffer = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
      let fullText = '';

      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        fullText += content.items.map((item) => item.str).join(' ') + '\n';
      }

      const fixtures = extractFixtures(fullText);

      if (fixtures.length === 0) {
        setError('No match fixtures found in the PDF. Check that the PDF contains lines like "Team A vs Team B" with dates.');
        setStatus('');
        setParsing(false);
        return;
      }

      setPreview(fixtures);
      setStatus(`Found ${fixtures.length} fixture(s). Review and confirm below.`);
    } catch (err) {
      setError('Failed to parse PDF: ' + err.message);
    } finally {
      setParsing(false);
    }
  };

  const removeFixture = (idx) => {
    setPreview(preview.filter((_, i) => i !== idx));
  };

  const clearPreview = () => {
    setPreview(null);
    setStatus('');
    setError('');
  };

  const confirmImport = () => {
    if (!preview || preview.length === 0) return;

    const key = target === 'cup' ? 'cupMatches' : 'shieldMatches';
    const newFixtures = preview.map((f) => ({
      id: Date.now() + Math.random(),
      homeTeam: f.homeTeam,
      awayTeam: f.awayTeam,
      date: normalizeDate(f.date),
      venue: f.venue,
      pool: f.pool || undefined,
      homeScore: undefined,
      awayScore: undefined,
    }));

    updateAppData({
      ...appData,
      [key]: [...(appData[key] ?? []), ...newFixtures],
    });

    setStatus(`Successfully imported ${newFixtures.length} fixture(s) to ${target === 'cup' ? 'Cup Division' : 'Shield Division'}.`);
    setPreview(null);
  };

  return (
    <div>
      <div className="admin-section">
        <h3>Import Fixtures from PDF</h3>
        <p style={{ color: 'var(--muted)', marginBottom: 16, lineHeight: 1.5 }}>
          Upload a PDF containing match fixtures. The parser looks for lines with "Team A vs Team B" 
          patterns and dates. Review the preview before confirming.
        </p>

        <div className="admin-form">
          <label>
            Import into
            <select value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="cup">Cup Division</option>
              <option value="shield">Shield Division</option>
            </select>
          </label>

          <label style={{ border: '2px dashed var(--border)', borderRadius: 8, padding: 24, textAlign: 'center', cursor: 'pointer' }}>
            <input type="file" accept="application/pdf" onChange={handleFile} style={{ display: 'none' }} />
            <span style={{ color: 'var(--primary)', fontWeight: 700 }}>
              {parsing ? 'Parsing PDF...' : 'Click to select a PDF file'}
            </span>
          </label>
        </div>

        {error && <p className="admin-error">{error}</p>}
        {status && <p className="admin-success">{status}</p>}
      </div>

      {preview && preview.length > 0 && (
        <div className="admin-section">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Preview ({preview.length} fixtures)</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="admin-btn" onClick={confirmImport}>Confirm Import</button>
              <button className="admin-btn-outline" onClick={clearPreview}>Cancel</button>
            </div>
          </div>

          <div className="admin-fixture-list">
            {preview.map((f, i) => (
              <div className="admin-fixture-item" key={i}>
                <div className="fixture-info">
                  <span className="fixture-teams">{f.homeTeam} vs {f.awayTeam}</span>
                  <span className="fixture-meta">
                    {f.date || 'Date TBC'}{f.venue ? ` · ${f.venue}` : ''}{f.pool ? ` · ${f.pool}` : ''}
                  </span>
                </div>
                <button className="admin-small-btn admin-btn-danger" onClick={() => removeFixture(i)}>
                  Remove
                </button>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
            <button className="admin-btn" onClick={confirmImport}>Confirm Import</button>
            <button className="admin-btn-outline" onClick={clearPreview}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

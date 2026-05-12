// app/page.js
'use client';

import { useData } from '@/context/DataContext';
import LeagueStandings from '@/components/LeagueStandings';
import PoolCards from '@/components/PoolCards';
import PoolStandings from '@/components/PoolStandings';
import Fixtures from '@/components/Fixtures';
import Results from '@/components/Results';
import LeagueStats from '@/components/LeagueStats';
import { useState } from 'react';

export default function Home() {
  const { appData } = useData();
  const [activeLeagueDiv, setActiveLeagueDiv] = useState(1);
  const [activeFixtureComp, setActiveFixtureComp] = useState('cup');
  const divisions = appData?.leagueData?.divisions ?? [];
  const selectedDivisionId = divisions.some(div => div.id === activeLeagueDiv)
    ? activeLeagueDiv
    : divisions[0]?.id;

  return (
    <>
      <header className="site-header">
        <div className="container">
          <h1 className="site-title">🏉 Limpopo Rugby Union</h1>
          <p className="site-description">League Divisions • Sibanye Super League 2026 • Cup & Shield</p>
        </div>
      </header>

      <nav className="main-nav">
        <div className="container">
          <ul className="nav-links">
            <li><a href="#league">League Standings</a></li>
            <li><a href="#super-league">Sibanye Super League</a></li>
            <li><a href="#fixtures">Fixtures</a></li>
            <li><a href="#results">Results</a></li>
          </ul>
        </div>
      </nav>

      <main className="container">
        {/* League Section */}
        <section id="league" className="section">
          <h2 className="section-title">League Competition</h2>
          <div className="division-tabs">
            {divisions.map(div => (
              <button
                key={div.id}
                className={`division-tab ${selectedDivisionId === div.id ? 'active' : ''}`}
                onClick={() => setActiveLeagueDiv(div.id)}
              >
                {div.name}
              </button>
            ))}
          </div>
          <LeagueStandings divisionId={selectedDivisionId} />
        </section>

        {/* Sibanye Super League */}
        <section id="super-league" className="section super-league-section">
          <div className="super-league-header">
            <h2 className="super-league-title">🏆 SIBANYE SUPER LEAGUE 2026</h2>
          </div>
          <div className="cup-division">
            <h3 className="division-super-title"><span className="title-decoration"></span> CUP DIVISION <span className="title-decoration"></span></h3>
            <PoolCards pools={appData?.cupPools} showStars />
            <PoolStandings pools={appData?.cupPools} matches={appData?.cupMatches} />
          </div>
          <div className="shield-division">
            <h3 className="division-super-title"><span className="title-decoration"></span> SHIELD DIVISION <span className="title-decoration"></span></h3>
            <PoolCards pools={appData?.shieldPools} />
            <PoolStandings pools={appData?.shieldPools} matches={appData?.shieldMatches} />
          </div>
        </section>

        {/* Fixtures */}
        <section id="fixtures" className="section">
          <h2 className="section-title">Sibanye Super League 2026 Fixtures</h2>
          <div className="competition-tabs">
            <button className={`competition-tab ${activeFixtureComp === 'cup' ? 'active' : ''}`} onClick={() => setActiveFixtureComp('cup')}>CUP DIVISION</button>
            <button className={`competition-tab ${activeFixtureComp === 'shield' ? 'active' : ''}`} onClick={() => setActiveFixtureComp('shield')}>SHIELD DIVISION</button>
          </div>
          {activeFixtureComp === 'cup' && <Fixtures matches={appData?.cupMatches} competition="cup" />}
          {activeFixtureComp === 'shield' && <Fixtures matches={appData?.shieldMatches} competition="shield" />}
        </section>

        {/* Results */}
        <section id="results" className="section">
          <h2 className="section-title">Recent Results</h2>
          <Results cupMatches={appData?.cupMatches} shieldMatches={appData?.shieldMatches} />
        </section>

        {/* Stats */}
        <section className="section stats-section">
          <h2 className="section-title">League Stats</h2>
          <LeagueStats />
        </section>
      </main>

      <footer className="site-footer">
        <div className="container">
          <p>&copy; 2025-2026 Limpopo Rugby Union</p>
          <p className="last-updated">Last updated: {new Date().toLocaleDateString('en-ZA', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </footer>
    </>
  );
}

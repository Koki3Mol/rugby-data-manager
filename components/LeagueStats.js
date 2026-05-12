'use client';

import { useData } from '@/context/DataContext';
import { hasScore, normalizePools } from './competitionUtils';

export default function LeagueStats() {
  const { appData } = useData();
  const divisions = appData?.leagueData?.divisions ?? [];
  const teams = divisions.reduce((total, division) => total + (division.teams?.length ?? 0), 0);
  const pools = normalizePools(appData?.cupPools).length + normalizePools(appData?.shieldPools).length;
  const matches = [
    ...(appData?.leagueMatches ?? []),
    ...(appData?.cupMatches ?? []),
    ...(appData?.shieldMatches ?? []),
  ];
  const completed = matches.filter(hasScore).length;

  return (
    <div className="stats-grid">
      <Stat label="Divisions" value={divisions.length} />
      <Stat label="Teams" value={teams} />
      <Stat label="Pools" value={pools} />
      <Stat label="Completed Matches" value={completed} />
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <article className="stat-card">
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

'use client';

import { useData } from '@/context/DataContext';
import { buildStandings, getTeamName } from './competitionUtils';

export default function LeagueStandings({ divisionId }) {
  const { appData } = useData();
  const divisions = appData?.leagueData?.divisions ?? [];
  const division = divisions.find((item) => String(item.id) === String(divisionId));

  if (!division) {
    return <p className="empty-state">No league division selected.</p>;
  }

  const teams = division.teams ?? [];
  const teamNames = new Set(teams.map(getTeamName));
  const matches = (appData?.leagueMatches ?? []).filter((match) => (
    String(match.divisionId ?? divisionId) === String(divisionId)
    || teamNames.has(match.homeTeam)
    || teamNames.has(match.awayTeam)
  ));
  const standings = buildStandings(teams, matches);

  if (standings.length === 0) {
    return <p className="empty-state">No teams configured for {division.name}.</p>;
  }

  return <StandingsTable rows={standings} />;
}

function StandingsTable({ rows }) {
  return (
    <div className="table-wrap">
      <table className="standings-table">
        <thead>
          <tr>
            <th>Team</th>
            <th>P</th>
            <th>W</th>
            <th>D</th>
            <th>L</th>
            <th>PF</th>
            <th>PA</th>
            <th>Diff</th>
            <th>Pts</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name}>
              <td>{row.name}</td>
              <td>{row.played}</td>
              <td>{row.won}</td>
              <td>{row.drawn}</td>
              <td>{row.lost}</td>
              <td>{row.pointsFor}</td>
              <td>{row.pointsAgainst}</td>
              <td>{row.diff}</td>
              <td>{row.points}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

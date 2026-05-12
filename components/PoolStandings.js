import { buildStandings, normalizePools } from './competitionUtils';

export default function PoolStandings({ pools, matches }) {
  const normalizedPools = normalizePools(pools);

  if (normalizedPools.length === 0) {
    return null;
  }

  return (
    <div className="pool-standings">
      {normalizedPools.map((pool) => {
        const teamNames = new Set(pool.teams.map((team) => team.name));
        const poolMatches = (matches ?? []).filter((match) => (
          String(match.pool ?? match.poolName ?? pool.name) === String(pool.name)
          || teamNames.has(match.homeTeam)
          || teamNames.has(match.awayTeam)
        ));
        const rows = buildStandings(pool.teams, poolMatches);

        return (
          <section className="pool-standing" key={pool.id}>
            <h4>{pool.name} Standings</h4>
            {rows.length === 0 ? (
              <p className="empty-state">No standings available.</p>
            ) : (
              <div className="table-wrap">
                <table className="standings-table">
                  <thead>
                    <tr>
                      <th>Team</th>
                      <th>P</th>
                      <th>W</th>
                      <th>D</th>
                      <th>L</th>
                      <th>Diff</th>
                      <th>Pts</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={`${pool.id}-${row.name}`}>
                        <td>{row.name}</td>
                        <td>{row.played}</td>
                        <td>{row.won}</td>
                        <td>{row.drawn}</td>
                        <td>{row.lost}</td>
                        <td>{row.diff}</td>
                        <td>{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

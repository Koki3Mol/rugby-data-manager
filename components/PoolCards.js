import { normalizePools } from './competitionUtils';

export default function PoolCards({ pools, showStars = false }) {
  const normalizedPools = normalizePools(pools);

  if (normalizedPools.length === 0) {
    return <p className="empty-state">No pools configured.</p>;
  }

  return (
    <div className="pool-grid">
      {normalizedPools.map((pool) => (
        <article className="pool-card" key={pool.id}>
          <h4>{pool.name}</h4>
          {pool.teams.length === 0 ? (
            <p className="empty-state">No teams assigned.</p>
          ) : (
            <ul>
              {pool.teams.map((team, index) => (
                <li key={`${pool.id}-${team.name}`}>
                  {showStars && index === 0 ? <span aria-hidden="true">*</span> : null}
                  {team.name}
                </li>
              ))}
            </ul>
          )}
        </article>
      ))}
    </div>
  );
}

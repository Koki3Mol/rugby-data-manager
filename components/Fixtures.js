import { formatDate, hasScore } from './competitionUtils';

export default function Fixtures({ matches, competition }) {
  const upcomingMatches = (matches ?? []).filter((match) => !hasScore(match));
  const label = competition === 'cup' ? 'Cup' : 'Shield';

  if (upcomingMatches.length === 0) {
    return <p className="empty-state">No {label.toLowerCase()} fixtures configured.</p>;
  }

  return (
    <div className="fixture-list">
      {upcomingMatches.map((match, index) => (
        <article className="fixture-card" key={match.id ?? `${competition}-${index}`}>
          <time dateTime={match.date}>{formatDate(match.date)}</time>
          <strong>{match.homeTeam ?? 'Home team'} vs {match.awayTeam ?? 'Away team'}</strong>
          {match.venue ? <span>{match.venue}</span> : null}
        </article>
      ))}
    </div>
  );
}

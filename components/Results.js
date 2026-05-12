import { formatDate, hasScore } from './competitionUtils';

export default function Results({ cupMatches, shieldMatches }) {
  const results = [
    ...(cupMatches ?? []).map((match) => ({ ...match, competition: 'Cup' })),
    ...(shieldMatches ?? []).map((match) => ({ ...match, competition: 'Shield' })),
  ].filter(hasScore);

  if (results.length === 0) {
    return <p className="empty-state">No results captured yet.</p>;
  }

  return (
    <div className="result-list">
      {results.map((match, index) => (
        <article className="result-card" key={match.id ?? `result-${index}`}>
          <span>{match.competition}</span>
          <time dateTime={match.date}>{formatDate(match.date)}</time>
          <strong>
            {match.homeTeam ?? 'Home team'} {match.homeScore} - {match.awayScore} {match.awayTeam ?? 'Away team'}
          </strong>
        </article>
      ))}
    </div>
  );
}

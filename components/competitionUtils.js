export function getTeamName(team) {
  if (typeof team === 'string') return team;
  return team?.name ?? team?.club ?? team?.team ?? 'Unnamed team';
}

export function normalizePools(pools) {
  if (Array.isArray(pools)) {
    return pools.map((pool, index) => {
      if (Array.isArray(pool)) {
        return {
          id: index,
          name: `Pool ${index + 1}`,
          teams: pool.map(normalizeTeam),
        };
      }

      return {
        id: pool?.id ?? pool?.name ?? index,
        name: pool?.name ?? pool?.poolName ?? `Pool ${index + 1}`,
        teams: toArray(pool?.teams ?? pool?.clubs).map(normalizeTeam),
      };
    });
  }

  if (pools && typeof pools === 'object') {
    return Object.entries(pools).map(([name, teams]) => ({
      id: name,
      name,
      teams: toArray(teams).map(normalizeTeam),
    }));
  }

  return [];
}

export function hasScore(match) {
  return isScore(match?.homeScore) && isScore(match?.awayScore);
}

export function formatDate(value) {
  if (!value) return 'Date TBC';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat('en-ZA', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function buildStandings(teams, matches) {
  const rows = new Map();

  toArray(teams).forEach((team) => {
    const name = getTeamName(team);
    rows.set(name, createRow(name, team));
  });

  toArray(matches).forEach((match) => {
    if (!hasScore(match)) return;

    const homeName = match.homeTeam ?? match.home;
    const awayName = match.awayTeam ?? match.away;
    if (!homeName || !awayName) return;

    const home = rows.get(homeName) ?? createRow(homeName);
    const away = rows.get(awayName) ?? createRow(awayName);

    applyResult(home, away, Number(match.homeScore), Number(match.awayScore));
    rows.set(homeName, home);
    rows.set(awayName, away);
  });

  return [...rows.values()]
    .map((row) => ({ ...row, diff: row.pointsFor - row.pointsAgainst }))
    .sort((a, b) => (
      b.points - a.points
      || b.diff - a.diff
      || b.pointsFor - a.pointsFor
      || a.name.localeCompare(b.name)
    ));
}

function normalizeTeam(team) {
  if (typeof team === 'string') return { name: team };
  return { ...team, name: getTeamName(team) };
}

function toArray(value) {
  return Array.isArray(value) ? value : [];
}

function isScore(value) {
  return value !== null && value !== undefined && value !== '' && !Number.isNaN(Number(value));
}

function createRow(name, team = {}) {
  return {
    name,
    played: Number(team.played ?? team.p ?? 0),
    won: Number(team.won ?? team.w ?? 0),
    drawn: Number(team.drawn ?? team.d ?? 0),
    lost: Number(team.lost ?? team.l ?? 0),
    pointsFor: Number(team.pointsFor ?? team.pf ?? 0),
    pointsAgainst: Number(team.pointsAgainst ?? team.pa ?? 0),
    points: Number(team.points ?? team.pts ?? 0),
  };
}

function applyResult(home, away, homeScore, awayScore) {
  home.played += 1;
  away.played += 1;
  home.pointsFor += homeScore;
  home.pointsAgainst += awayScore;
  away.pointsFor += awayScore;
  away.pointsAgainst += homeScore;

  if (homeScore > awayScore) {
    home.won += 1;
    away.lost += 1;
    home.points += 4;
    return;
  }

  if (awayScore > homeScore) {
    away.won += 1;
    home.lost += 1;
    away.points += 4;
    return;
  }

  home.drawn += 1;
  away.drawn += 1;
  home.points += 2;
  away.points += 2;
}

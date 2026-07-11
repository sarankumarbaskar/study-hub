export interface LeaderboardEntry {
  name: string;
  score: number;
  game: string;
  date: string;
}

const STORAGE_KEY = "playzone_leaderboard";

export function getLeaderboard(): LeaderboardEntry[] {
  if (typeof window === "undefined") return [];
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data) as LeaderboardEntry[];
  } catch {
    return [];
  }
}

export function addScore(entry: Omit<LeaderboardEntry, "date">) {
  const entries = getLeaderboard();
  entries.push({ ...entry, date: new Date().toISOString() });
  entries.sort((a, b) => b.score - a.score);
  const trimmed = entries.slice(0, 100);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  return trimmed;
}

export function getTopScores(game?: string, limit = 10): LeaderboardEntry[] {
  const entries = getLeaderboard();
  const filtered = game ? entries.filter((e) => e.game === game) : entries;
  return filtered.slice(0, limit);
}

export function clearLeaderboard() {
  localStorage.removeItem(STORAGE_KEY);
}

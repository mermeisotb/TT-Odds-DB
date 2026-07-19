export interface OddsSelection {
  id: string;
  homeTeam: string;
  awayTeam: string;
  tournament: string;
  market: string;
  selection: string;
  betanoOdd?: number;
  xbetOdd?: number;
  myProb: number;
  notes: string;
  time: string;
}

export interface ParsedCSV {
  source: "betano" | "xbet";
  rows: Record<string, string>[];
}

const STORAGE_KEY = "tt_odds_data";

function generateId(row: Record<string, string>): string {
  const h = (row.home_team || "").trim();
  const a = (row.away_team || "").trim();
  const m = (row.market || "").trim();
  const s = (row.selection || "").trim();
  return `${h}|${a}|${m}|${s}`;
}

export function parseCSV(text: string, source: "betano" | "xbet"): ParsedCSV {
  const lines = text.trim().split(/\r?\n/).filter(l => l.trim());
  if (lines.length < 2) return { source, rows: [] };

  const firstLine = lines[0];
  if (!firstLine) return { source, rows: [] };
  const headers = firstLine.split(",").map(h => h.trim().replace(/^"|"$/g, ""));
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(",").map(v => v.trim().replace(/^"|"$/g, ""));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }

  return { source, rows };
}

export function mergeOdds(parsed: ParsedCSV[]): OddsSelection[] {
  const map = new Map<string, Partial<OddsSelection>>();
  const saved = getStoredOdds();
  const savedMap = new Map(saved.map(s => [s.id, s]));

  for (const p of parsed) {
    for (const row of p.rows) {
      const id = generateId(row);
      const existing = map.get(id) || {
        id,
        homeTeam: row.home_team || "",
        awayTeam: row.away_team || "",
        tournament: row.tournament || row.competition || "",
        market: row.market || "",
        selection: row.selection || "",
        time: row.time || "",
      };

      const odd = parseFloat(row.odd);
      if (!isNaN(odd)) {
        if (p.source === "betano") existing.betanoOdd = odd;
        if (p.source === "xbet") existing.xbetOdd = odd;
      }

      map.set(id, existing);
    }
  }

  return Array.from(map.values()).map((raw): OddsSelection => {
    const savedRow = savedMap.get(raw.id!);
    return {
      id: raw.id!,
      homeTeam: raw.homeTeam!,
      awayTeam: raw.awayTeam!,
      tournament: raw.tournament || "",
      market: raw.market!,
      selection: raw.selection!,
      betanoOdd: raw.betanoOdd,
      xbetOdd: raw.xbetOdd,
      myProb: savedRow?.myProb ?? 50,
      notes: savedRow?.notes ?? "",
      time: raw.time || "",
    };
  });
}

export function getBestOdd(selection: OddsSelection): number {
  const odds = [selection.betanoOdd, selection.xbetOdd].filter((o): o is number => o !== undefined && !isNaN(o));
  return odds.length > 0 ? Math.max(...odds) : 1;
}

export function calcImpliedProb(odd: number): number {
  return (1 / odd) * 100;
}

export function calcEdge(myProb: number, bestOdd: number): number {
  const implied = calcImpliedProb(bestOdd);
  return ((myProb - implied) / implied) * 100;
}

export function getSignal(edge: number): "value" | "edge" | "avoid" | "neutral" {
  if (edge >= 10) return "value";
  if (edge >= 5) return "edge";
  if (edge <= -15) return "avoid";
  return "neutral";
}

export function storeOdds(data: OddsSelection[]) {
  if (typeof window !== "undefined") {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }
}

export function getStoredOdds(): OddsSelection[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearStoredOdds() {
  if (typeof window !== "undefined") {
    localStorage.removeItem(STORAGE_KEY);
  }
}
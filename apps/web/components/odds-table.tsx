"use client";

import { useState, useMemo } from "react";
import { Card, CardContent } from "@workspace/ui/components/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@workspace/ui/components/table";
import { Badge } from "@workspace/ui/components/badge";
import { Search, ArrowUpDown } from "lucide-react";
import {
  OddsSelection,
  getBestOdd,
  calcImpliedProb,
  calcEdge,
  getSignal,
  storeOdds,
} from "@/lib/odds";

interface OddsTableProps {
  data: OddsSelection[];
  onUpdate: (data: OddsSelection[]) => void;
}

export function OddsTable({ data, onUpdate }: OddsTableProps) {
  const [search, setSearch] = useState("");
  const [tourneyFilter, setTourneyFilter] = useState("all");
  const [minEdge, setMinEdge] = useState(0);
  const [sortBy, setSortBy] = useState<"edge" | "time">("edge");

  const tournaments = useMemo(
    () => Array.from(new Set(data.map((d) => d.tournament).filter(Boolean))),
    [data]
  );

  const filtered = useMemo(() => {
    let rows = data.filter((row) => {
      const best = getBestOdd(row);
      const edge = calcEdge(row.myProb, best);
      const matchText = `${row.homeTeam} ${row.awayTeam}`.toLowerCase();
      if (search && !matchText.includes(search.toLowerCase())) return false;
      if (tourneyFilter !== "all" && row.tournament !== tourneyFilter) return false;
      if (edge < minEdge) return false;
      return true;
    });

    rows.sort((a, b) => {
      if (sortBy === "edge") {
        const edgeA = calcEdge(a.myProb, getBestOdd(a));
        const edgeB = calcEdge(b.myProb, getBestOdd(b));
        return edgeB - edgeA;
      }
      return 0;
    });

    return rows;
  }, [data, search, tourneyFilter, minEdge, sortBy]);

  const stats = useMemo(() => {
    const values = data.map((row) => calcEdge(row.myProb, getBestOdd(row)));
    const valueCount = values.filter((e) => e >= 5).length;
    const avgEdge = values.length ? values.reduce((a, b) => a + b, 0) / values.length : 0;
    return { total: data.length, valueCount, avgEdge };
  }, [data]);

  const updateProb = (id: string, value: string) => {
    const prob = parseFloat(value);
    if (isNaN(prob)) return;
    const updated = data.map((row) => (row.id === id ? { ...row, myProb: prob } : row));
    storeOdds(updated);
    onUpdate(updated);
  };

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Selections</div>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Value bets (5%+)</div>
            <div className="text-2xl font-bold text-emerald-500">{stats.valueCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Avg edge</div>
            <div className={`text-2xl font-bold ${stats.avgEdge >= 0 ? "text-emerald-500" : "text-red-500"}`}>
              {stats.avgEdge >= 0 ? "+" : ""}
              {stats.avgEdge.toFixed(1)}%
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-xs text-muted-foreground">Filtered</div>
            <div className="text-2xl font-bold">{filtered.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            placeholder="Search player..."
            className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 pl-8 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={tourneyFilter}
          onChange={(e) => setTourneyFilter(e.target.value)}
        >
          <option value="all">All tournaments</option>
          {tournaments.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
        <select
          className="h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={minEdge}
          onChange={(e) => setMinEdge(Number(e.target.value))}
        >
          <option value={0}>Min edge: Any</option>
          <option value={5}>5%+</option>
          <option value={10}>10%+</option>
          <option value={15}>15%+</option>
        </select>
        <button
          onClick={() => setSortBy(sortBy === "edge" ? "time" : "edge")}
          className="inline-flex h-9 items-center gap-1 rounded-md border border-input bg-background px-3 text-sm font-medium hover:bg-muted"
        >
          <ArrowUpDown className="h-3.5 w-3.5" />
          {sortBy === "edge" ? "Edge" : "Time"}
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Match</TableHead>
              <TableHead>Market</TableHead>
              <TableHead className="text-right">Betano</TableHead>
              <TableHead className="text-right">1xBet</TableHead>
              <TableHead className="text-right">Best</TableHead>
              <TableHead className="text-right">Implied</TableHead>
              <TableHead className="text-right w-24">My prob %</TableHead>
              <TableHead className="text-right">Edge</TableHead>
              <TableHead>Signal</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-muted-foreground py-8">
                  No data. Upload a CSV to get started.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((row) => {
                const best = getBestOdd(row);
                const implied = calcImpliedProb(best);
                const edge = calcEdge(row.myProb, best);
                const signal = getSignal(edge);
                const isValue = edge >= 5;

                return (
                  <TableRow key={row.id} className={isValue ? "bg-emerald-500/5" : undefined}>
                    <TableCell>
                      <div className="font-medium">
                        {row.homeTeam} vs {row.awayTeam}
                      </div>
                      {row.tournament && (
                        <div className="text-xs text-muted-foreground">{row.tournament}</div>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">{row.market}</div>
                      <div className="text-xs text-muted-foreground">{row.selection}</div>
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {row.betanoOdd ? row.betanoOdd.toFixed(2) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm">
                      {row.xbetOdd ? row.xbetOdd.toFixed(2) : "—"}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm font-medium text-emerald-600">
                      {best.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right font-mono text-sm text-muted-foreground">
                      {implied.toFixed(1)}%
                    </TableCell>
                    <TableCell className="text-right">
                      <input
                        type="number"
                        min={0}
                        max={100}
                        step={0.1}
                        value={row.myProb}
                        onChange={(e) => updateProb(row.id, e.target.value)}
                        className="w-20 h-8 rounded-md border border-input bg-transparent px-2 text-right text-sm font-mono focus:outline-none focus:ring-1 focus:ring-ring"
                      />
                    </TableCell>
                    <TableCell
                      className={`text-right font-mono text-sm font-medium ${
                        edge > 0 ? "text-emerald-500" : edge < -10 ? "text-red-500" : "text-muted-foreground"
                      }`}
                    >
                      {edge >= 0 ? "+" : ""}
                      {edge.toFixed(1)}%
                    </TableCell>
                    <TableCell>
                      {signal === "value" && <Badge className="bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20">VALUE</Badge>}
                      {signal === "edge" && <Badge variant="secondary">EDGE</Badge>}
                      {signal === "avoid" && <Badge variant="destructive">AVOID</Badge>}
                      {signal === "neutral" && <span className="text-xs text-muted-foreground">—</span>}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
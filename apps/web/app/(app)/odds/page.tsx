"use client";

import { useState, useEffect } from "react";
import { CsvUploader } from "@/components/csv-uploader";
import { OddsTable } from "@/components/odds-table";
import { parseCSV, mergeOdds, getStoredOdds, clearStoredOdds, OddsSelection } from "@/lib/odds";

export default function OddsPage() {
  const [data, setData] = useState<OddsSelection[]>([]);

  useEffect(() => {
    const saved = getStoredOdds();
    if (saved.length > 0) setData(saved);
  }, []);

  const handleFiles = (files: { name: string; text: string }[]) => {
    const parsed = files.map((f) => {
      const source = f.name.toLowerCase().includes("betano") ? "betano" : "xbet";
      return parseCSV(f.text, source as "betano" | "xbet");
    });
    const merged = mergeOdds(parsed);
    setData(merged);
  };

  const handleClear = () => {
    clearStoredOdds();
    setData([]);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Odds comparison</h1>
        <p className="text-sm text-muted-foreground">
          Upload Betano and 1xBet CSVs, set your estimated probabilities, find value.
        </p>
      </div>

      <CsvUploader onFilesParsed={handleFiles} onClear={handleClear} hasData={data.length > 0} />

      {data.length > 0 && <OddsTable data={data} onUpdate={setData} />}
    </div>
  );
}
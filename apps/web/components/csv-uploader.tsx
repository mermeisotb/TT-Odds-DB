"use client";

import { useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@workspace/ui/components/card";
import { Upload, Trash2 } from "lucide-react";
import { Button } from "@workspace/ui/components/button";

interface CsvUploaderProps {
  onFilesParsed: (files: { name: string; text: string }[]) => void;
  onClear: () => void;
  hasData: boolean;
}

export function CsvUploader({ onFilesParsed, onClear, hasData }: CsvUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  const parseFiles = async (files: File[]) => {
    const parsed = await Promise.all(
      files.map(async (file) => ({
        name: file.name,
        text: await file.text(),
      }))
    );
    onFilesParsed(parsed);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const files = Array.from(e.dataTransfer.files).filter((f) => f.name.endsWith(".csv"));
      parseFiles(files);
    },
    [onFilesParsed]
  );

  const handleInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []).filter((f) => f.name.endsWith(".csv"));
      parseFiles(files);
      e.target.value = "";
    },
    [onFilesParsed]
  );

  const handleClick = () => {
    inputRef.current?.click();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium">Upload odds CSV</CardTitle>
        {hasData && (
          <Button variant="ghost" size="sm" onClick={onClear}>
            <Trash2 className="mr-2 h-4 w-4" />
            Clear
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={handleClick}
          className="relative flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-input p-8 text-center transition-colors hover:bg-muted cursor-pointer"
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            multiple
            onChange={handleInput}
            className="hidden"
          />
          <Upload className="h-8 w-8 text-muted-foreground" />
          <div className="text-sm text-muted-foreground">
            Drop <strong>CSV files</strong> here
          </div>
          <div className="text-xs text-muted-foreground">or click to browse</div>
        </div>
        <div className="mt-3 text-xs text-muted-foreground">
          Expected columns: <code>home_team, away_team, market, selection, odd</code>
        </div>
      </CardContent>
    </Card>
  );
}
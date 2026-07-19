"use client";

import { useState } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import Link from "next/link";

export default function PredictorPage() {
  const [loaded, setLoaded] = useState(false);

  // TODO: cambia esta URL por la de tu app en Streamlit Cloud
  const STREAMLIT_URL = "https://mundial-predictor.streamlit.app/?embed=true";

  return (
    <div className="relative flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden bg-zinc-950">
      {/* Header minimal */}
      <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900/50 px-4 py-2">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 rounded-md bg-zinc-800 px-3 py-1.5 text-sm font-medium text-zinc-100 hover:bg-zinc-700 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Link>
          <h1 className="text-sm font-semibold text-zinc-100 tracking-tight">
            Mundial Predictor
          </h1>
        </div>
        <a
          href={STREAMLIT_URL.replace("?embed=true", "")}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-zinc-200 transition-colors"
        >
          Abrir en nueva pestana
          <ExternalLink className="h-3 w-3" />
        </a>
      </div>

      {/* Iframe */}
      <div className="relative flex-1">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-950">
            <div className="flex flex-col items-center gap-2">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-700 border-t-red-500" />
              <span className="text-xs text-zinc-400">Cargando predictor...</span>
            </div>
          </div>
        )}
        <iframe
          src={STREAMLIT_URL}
          className="h-full w-full border-0"
          onLoad={() => setLoaded(true)}
          allow="clipboard-write"
          title="Mundial Predictor"
        />
      </div>
    </div>
  );
}


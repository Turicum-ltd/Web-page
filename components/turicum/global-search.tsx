"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { withBasePath } from "@/lib/turicum/runtime";

interface SearchCaseResult {
  id: string;
  code: string;
  title: string;
  stage: string;
}

function normalizeQuery(value: string) {
  return value.trim().toLowerCase();
}

function looksLikeCaseCode(value: string) {
  return /^[a-z]{2}-[a-z]{3,5}-/i.test(value.trim());
}

export function TuricumGlobalSearch() {
  const [query, setQuery] = useState("");
  const [cases, setCases] = useState<SearchCaseResult[]>([]);
  const [hasLoaded, setHasLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadCases() {
      try {
        const response = await fetch(withBasePath("/api/cases"), {
          credentials: "same-origin",
          cache: "no-store"
        });

        if (!response.ok) {
          throw new Error("Case search could not be loaded.");
        }

        const payload = (await response.json()) as { items?: SearchCaseResult[] };

        if (!cancelled) {
          setCases(payload.items ?? []);
        }
      } catch {
        if (!cancelled) {
          setCases([]);
        }
      } finally {
        if (!cancelled) {
          setHasLoaded(true);
        }
      }
    }

    void loadCases();

    return () => {
      cancelled = true;
    };
  }, []);

  const normalizedQuery = normalizeQuery(query);

  const shortcutCase = useMemo(() => {
    if (!normalizedQuery || !looksLikeCaseCode(normalizedQuery)) {
      return null;
    }

    return (
      cases.find((item) => item.code.toLowerCase() === normalizedQuery) ??
      cases.find((item) => item.code.toLowerCase().startsWith(normalizedQuery)) ??
      null
    );
  }, [cases, normalizedQuery]);

  const matchingCases = useMemo(() => {
    if (!normalizedQuery) {
      return [];
    }

    return cases
      .filter((item) => {
        const haystack = [item.code, item.title, item.stage].join(" ").toLowerCase();
        return haystack.includes(normalizedQuery);
      })
      .filter((item) => item.id !== shortcutCase?.id)
      .slice(0, 6);
  }, [cases, normalizedQuery, shortcutCase?.id]);

  const hasResults = Boolean(shortcutCase) || matchingCases.length > 0;

  return (
    <div className="turicum-global-search">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search Turicum"
        aria-label="Search Turicum"
      />
      {normalizedQuery ? (
        <div className="turicum-global-search-dropdown">
          {shortcutCase ? (
            <Link
              href={withBasePath(`/cases/${shortcutCase.id}`)}
              className="turicum-global-search-result is-shortcut"
            >
              <span className="turicum-global-search-result-kicker">Go to Case</span>
              <strong>{shortcutCase.code}</strong>
              <small>{shortcutCase.title}</small>
            </Link>
          ) : null}

          {matchingCases.map((item) => (
            <Link
              key={item.id}
              href={withBasePath(`/cases/${item.id}`)}
              className="turicum-global-search-result"
            >
              <strong>{item.code}</strong>
              <small>
                {item.title} · {item.stage.replaceAll("_", " ")}
              </small>
            </Link>
          ))}

          {!hasResults ? (
            <div className="turicum-global-search-empty">
              {hasLoaded ? "No search results yet." : "Loading search results..."}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

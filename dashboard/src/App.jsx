import { useEffect, useRef, useState } from "react";
import { fetchArticles } from "./api";
import { ArticlesTable } from "./components/ArticlesTable";
import { Spinner } from "./components/Spinner";

const PAGE_SIZE = 8;

export default function App() {
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [page, setPage] = useState(1);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [errorDetail, setErrorDetail] = useState("");
  const [reloadKey, setReloadKey] = useState(0);
  const appliedQuery = useRef("");
  const loadedPage = useRef(1);

  function retry() {
    setLoading(true);
    setError("");
    setErrorDetail("");
    setReloadKey((value) => value + 1);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      const next = query.trim();
      if (appliedQuery.current === next) {
        return;
      }
      appliedQuery.current = next;
      setDebouncedQuery(next);
      setPage(1);
      setLoading(true);
      setError("");
      setErrorDetail("");
    }, 300);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const controller = new AbortController();

    fetchArticles({
      page,
      pageSize: PAGE_SIZE,
      query: debouncedQuery,
      signal: controller.signal,
    })
      .then((payload) => {
        setData(payload);
        setError("");
        setErrorDetail("");
        loadedPage.current = payload.page || page;
        setLoading(false);
      })
      .catch((err) => {
        if (err.name === "AbortError") {
          return;
        }
        setError(err.message || "Could not load articles.");
        setErrorDetail(typeof err.detail === "string" ? err.detail : "");
        setLoading(false);
        setPage(loadedPage.current);
      });

    return () => controller.abort();
  }, [page, debouncedQuery, reloadKey]);

  const total = data?.total ?? 0;
  const items = data?.items ?? [];
  const visiblePage = data?.page || page;
  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const rangeStart = total === 0 ? 0 : (visiblePage - 1) * PAGE_SIZE + 1;
  const rangeEnd = Math.min(visiblePage * PAGE_SIZE, total);
  const statusLabel = loading && !data
    ? "Fetching articles"
    : error && !data
      ? "Articles unavailable"
      : error
        ? "Showing the last results"
        : `${total} ${total === 1 ? "article" : "articles"}`;

  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b border-line bg-card">
        <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 sm:px-6 lg:py-10">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pine">Catalog</p>
            <h1 className="mt-2 font-serif text-4xl font-medium tracking-tight sm:text-5xl">
              Article search
            </h1>
            <p className="mt-3 max-w-2xl text-base leading-7 text-stone-600">
              Search titles, summaries, and links from the articles API, then scan the matches in the table.
            </p>
          </div>
          <form role="search" onSubmit={(event) => event.preventDefault()}>
            <label htmlFor="article-search" className="sr-only">
              Search articles
            </label>
            <div className="relative">
              <SearchIcon />
              <input
                id="article-search"
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, summary, or link"
                autoComplete="off"
                className="w-full rounded-2xl border border-line bg-sand py-4 pr-4 pl-12 text-base text-ink shadow-sm outline-none placeholder:text-stone-400 focus:border-pine focus:ring-2 focus:ring-pine/30"
              />
            </div>
          </form>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <section className="overflow-hidden rounded-2xl border border-line bg-card shadow-sm" aria-busy={loading}>
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3 text-sm text-stone-600">
            <p>{statusLabel}</p>
            {error ? (
              <p>Couldn’t refresh</p>
            ) : debouncedQuery ? (
              <p>Matching “{debouncedQuery}”</p>
            ) : (
              <p>All articles</p>
            )}
          </div>

          {loading ? <Spinner /> : null}
          {!loading && error && items.length === 0 ? (
            <ApiFailure message={error} detail={errorDetail} onRetry={retry} />
          ) : null}
          {!loading && error && items.length > 0 ? (
            <div className="border-b border-line bg-clay-soft px-4 py-4 sm:flex sm:items-center sm:justify-between sm:gap-4">
              <ApiFailureCopy message={error} detail={errorDetail} compact />
              <button type="button" onClick={retry} className="mt-3 shrink-0 rounded-full bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-pine-dark sm:mt-0">
                Try again
              </button>
            </div>
          ) : null}
          {!loading && !error && items.length === 0 ? (
            <p className="px-4 py-16 text-center text-stone-600">
              {debouncedQuery ? "No articles match that search." : "No articles yet."}
            </p>
          ) : null}
          {!loading && items.length > 0 ? <ArticlesTable items={items} /> : null}

          {!loading && total > 0 ? (
            <nav aria-label="Pagination" className="flex flex-col gap-3 border-t border-line px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm text-stone-600">
                Showing {rangeStart}–{rangeEnd} of {total}
              </p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setError("");
                    setErrorDetail("");
                    setPage((current) => Math.max(1, current - 1));
                  }}
                  disabled={page <= 1}
                  className="rounded-full border border-line px-4 py-2 text-sm font-medium enabled:hover:bg-sand disabled:cursor-not-allowed disabled:text-stone-400"
                >
                  Previous
                </button>
                <p className="min-w-24 text-center text-sm text-stone-600">
                  Page {visiblePage} of {pageCount}
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setLoading(true);
                    setError("");
                    setErrorDetail("");
                    setPage((current) => Math.min(pageCount, current + 1));
                  }}
                  disabled={page >= pageCount}
                  className="rounded-full border border-line px-4 py-2 text-sm font-medium enabled:hover:bg-sand disabled:cursor-not-allowed disabled:text-stone-400"
                >
                  Next
                </button>
              </div>
            </nav>
          ) : null}
        </section>
      </main>
    </div>
  );
}

function ApiFailure({ message, detail, onRetry }) {
  return (
    <div className="px-4 py-16 text-center">
      <ApiFailureCopy message={message} detail={detail} />
      <button
        type="button"
        onClick={onRetry}
        className="mt-5 rounded-full bg-pine px-4 py-2 text-sm font-medium text-white hover:bg-pine-dark"
      >
        Try again
      </button>
    </div>
  );
}

function ApiFailureCopy({ message, detail, compact = false }) {
  return (
    <div role="alert" className={compact ? "text-left" : ""}>
      <p className={compact ? "text-sm font-medium text-ink" : "font-serif text-2xl text-ink"}>
        {compact ? "Couldn’t refresh articles" : "Couldn’t load articles"}
      </p>
      <p className={`text-sm leading-6 text-clay ${compact ? "mt-1" : "mt-2"}`}>{message}</p>
      {detail ? <p className="mt-1 text-sm leading-6 text-stone-600">{detail}</p> : null}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-stone-400"
    >
      <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16.5 20 20.5" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

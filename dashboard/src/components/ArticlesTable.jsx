function formatWhen(value) {
  if (!value) {
    return "—";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "—";
  }
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function Cell({ label, className = "", children }) {
  return (
    <td className={`block px-4 py-3 md:table-cell md:px-4 md:py-4 md:align-top ${className}`}>
      <span className="mb-1 block text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 md:hidden">
        {label}
      </span>
      {children}
    </td>
  );
}

export function ArticlesTable({ items }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse text-left">
        <caption className="sr-only">Articles</caption>
        <thead className="hidden border-b border-line bg-sand text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500 md:table-header-group">
          <tr>
            <th scope="col" className="px-4 py-3 font-semibold">Title</th>
            <th scope="col" className="px-4 py-3 font-semibold">Summary</th>
            <th scope="col" className="px-4 py-3 font-semibold">Link</th>
            <th scope="col" className="px-4 py-3 font-semibold">Published</th>
          </tr>
        </thead>
        <tbody>
          {items.map((article) => (
            <tr
              key={article.id}
              className="block border-b border-line last:border-b-0 md:table-row md:hover:bg-sand"
            >
              <Cell label="Title" className="font-medium text-ink md:w-[28%]">
                {article.title}
              </Cell>
              <Cell label="Summary" className="text-sm leading-6 text-stone-600">
                <span className="line-clamp-3">{article.body || "—"}</span>
              </Cell>
              <Cell label="Link" className="text-sm md:w-[22%]">
                {article.url ? (
                  <a
                    href={article.url}
                    className="break-all text-pine underline decoration-pine/30 underline-offset-2 hover:text-pine-dark"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {article.url.replace(/^https?:\/\//, "")}
                  </a>
                ) : (
                  <span className="text-stone-400">—</span>
                )}
              </Cell>
              <Cell label="Published" className="whitespace-nowrap text-sm text-stone-600 md:w-[18%]">
                {formatWhen(article.created_at)}
              </Cell>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

const ARTICLES_URL = "http://localhost:8000/api/articles";

export async function fetchArticles({ page, pageSize, query, signal }) {
  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });
  if (query) {
    params.set("q", query);
  }

  let response;
  try {
    response = await fetch(`${ARTICLES_URL}?${params.toString()}`, { signal });
  } catch (error) {
    if (error.name === "AbortError") {
      throw error;
    }
    throw new Error("The articles API is not reachable at http://localhost:8000/api/articles.");
  }

  if (!response.ok) {
    throw new Error(`Could not load articles (${response.status}).`);
  }
  return response.json();
}

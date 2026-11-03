const ARTICLES_URL = "http://localhost:8000/api/articles";

function messageForStatus(status) {
  if (status === 503) {
    return "The articles API is unavailable right now. Check that its database is configured, then try again.";
  }
  if (status === 422) {
    return "That page or search isn’t valid. Change it and try again.";
  }
  if (status >= 500) {
    return "The articles API ran into a problem. Try again in a moment.";
  }
  if (status >= 400) {
    return `The articles API rejected the request (${status}).`;
  }
  return "Could not load articles.";
}

async function readDetail(response) {
  try {
    const body = await response.json();
    if (typeof body?.detail === "string") {
      return body.detail.trim();
    }
  } catch {
    return "";
  }
  return "";
}

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
    throw new Error(
      "Can’t reach the articles API at http://localhost:8000. Start it and try again.",
    );
  }

  if (!response.ok) {
    const failure = new Error(messageForStatus(response.status));
    failure.detail = await readDetail(response);
    throw failure;
  }

  try {
    return await response.json();
  } catch {
    throw new Error("The articles API sent a response the dashboard couldn’t read.");
  }
}

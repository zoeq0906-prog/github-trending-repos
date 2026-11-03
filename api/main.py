from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import articles

app = FastAPI(title="Articles API")
# The dashboard is served from another localhost port. This middleware adds
# Access-Control-Allow-Origin on success and on error responses so the
# browser can read 4xx/5xx bodies instead of hiding them as network failures.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
    max_age=600,
)
app.include_router(articles.router, prefix="/api")

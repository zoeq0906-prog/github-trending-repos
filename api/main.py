from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routers import articles

app = FastAPI(title="Articles API")
# The React dashboard runs on another localhost port and fetches this API.
app.add_middleware(
    CORSMiddleware,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1):\d+",
    allow_methods=["GET", "OPTIONS"],
    allow_headers=["*"],
)
app.include_router(articles.router, prefix="/api")

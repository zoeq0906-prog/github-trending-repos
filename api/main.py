from fastapi import FastAPI

from api.routers import articles

app = FastAPI(title="Articles API")
app.include_router(articles.router, prefix="/api")

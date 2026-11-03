from datetime import datetime

from pydantic import BaseModel, ConfigDict


class ArticleOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    body: str | None = None
    url: str | None = None
    created_at: datetime | None = None


class ArticlePage(BaseModel):
    items: list[ArticleOut]
    page: int
    page_size: int
    total: int

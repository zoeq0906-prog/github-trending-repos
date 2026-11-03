from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session

from api.database import get_db
from api.models import Article
from api.schemas import ArticlePage

router = APIRouter()


def _search_match(q: str | None):
    if q is None or not q.strip():
        return None
    escaped = (
        q.strip()
        .replace("\\", "\\\\")
        .replace("%", "\\%")
        .replace("_", "\\_")
    )
    term = f"%{escaped}%"
    return or_(
        Article.title.ilike(term, escape="\\"),
        Article.body.ilike(term, escape="\\"),
        Article.url.ilike(term, escape="\\"),
    )


@router.get("/articles", response_model=ArticlePage)
def list_articles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    q: str | None = Query(default=None, max_length=200),
    db: Session = Depends(get_db),
) -> ArticlePage:
    match = _search_match(q)
    count_stmt = select(func.count()).select_from(Article)
    list_stmt = select(Article).order_by(Article.id)
    if match is not None:
        count_stmt = count_stmt.where(match)
        list_stmt = list_stmt.where(match)
    total = db.scalar(count_stmt) or 0
    items = db.scalars(
        list_stmt.offset((page - 1) * page_size).limit(page_size)
    ).all()
    return ArticlePage(items=items, page=page, page_size=page_size, total=total)

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from api.database import get_db
from api.models import Article
from api.schemas import ArticlePage

router = APIRouter()


@router.get("/articles", response_model=ArticlePage)
def list_articles(
    page: int = Query(1, ge=1),
    page_size: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db),
) -> ArticlePage:
    total = db.scalar(select(func.count()).select_from(Article)) or 0
    stmt = (
        select(Article)
        .order_by(Article.id)
        .offset((page - 1) * page_size)
        .limit(page_size)
    )
    items = db.scalars(stmt).all()
    return ArticlePage(items=items, page=page, page_size=page_size, total=total)

"""Article row read by GET /api/articles.

The repository did not already define an articles table. This model is the
schema that endpoint reads from the database pointed at by DATABASE_URL.
"""

from datetime import datetime

from sqlalchemy import DateTime, Integer, String, Text
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column


class Base(DeclarativeBase):
    pass


class Article(Base):
    __tablename__ = "articles"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(String(500), nullable=False)
    body: Mapped[str | None] = mapped_column(Text, nullable=True)
    url: Mapped[str | None] = mapped_column(String(2048), nullable=True)
    created_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)

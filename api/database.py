"""SQLAlchemy session shared by the articles API.

This repo keeps runtime configuration in the environment (and an optional
local .env). See scripts/config.js, which loads dotenv and reads
GITHUB_TOKEN the same way. The engine is built only from DATABASE_URL.
Credentials are not stored in the repository, and this module does not
create a database server.
"""

import os
from collections.abc import Generator

from dotenv import load_dotenv
from fastapi import HTTPException
from sqlalchemy import create_engine
from sqlalchemy.engine import Engine
from sqlalchemy.orm import Session, sessionmaker

load_dotenv()

_engine: Engine | None = None
_SessionLocal: sessionmaker[Session] | None = None


def get_database_url() -> str:
    url = os.environ.get("DATABASE_URL", "").strip()
    if not url:
        raise RuntimeError(
            "DATABASE_URL is not set. Set it in the environment or .env; "
            "credentials are not stored in the repo."
        )
    return url


def get_engine() -> Engine:
    global _engine, _SessionLocal
    if _engine is None:
        url = get_database_url()
        connect_args = {"check_same_thread": False} if url.startswith("sqlite") else {}
        _engine = create_engine(url, connect_args=connect_args)
        _SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=_engine)
    return _engine


def get_db() -> Generator[Session, None, None]:
    """Yield a session, or 503 when DATABASE_URL is missing."""
    try:
        get_engine()
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from exc
    if _SessionLocal is None:
        raise HTTPException(status_code=503, detail="Database session is not configured")
    db = _SessionLocal()
    try:
        yield db
    finally:
        db.close()

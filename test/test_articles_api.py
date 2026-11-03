"""Pagination and search tests for GET /api/articles.

Uses an in-memory SQLite session injected through the existing get_db
dependency. The app itself still reads DATABASE_URL and does not create a
database.
"""

import os
import unittest
from datetime import datetime

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from api.database import get_db
from api.main import app
from api.models import Article, Base


class ArticlesEndpointTest(unittest.TestCase):
    def setUp(self):
        self.engine = create_engine(
            "sqlite://",
            connect_args={"check_same_thread": False},
            poolclass=StaticPool,
        )
        Base.metadata.create_all(self.engine)
        self.Session = sessionmaker(bind=self.engine)
        self._seed()

        def override_get_db():
            db = self.Session()
            try:
                yield db
            finally:
                db.close()

        app.dependency_overrides[get_db] = override_get_db
        self.client = TestClient(app)

    def tearDown(self):
        app.dependency_overrides.clear()
        Base.metadata.drop_all(self.engine)
        self.engine.dispose()

    def _seed(self):
        db = self.Session()
        try:
            for index in range(1, 4):
                db.add(Article(
                    title=f"Article {index}",
                    body=f"Body {index}",
                    url=f"https://example.com/{index}",
                    created_at=datetime(2026, 1, index, 12, 0, 0),
                ))
            db.commit()
        finally:
            db.close()

    def test_first_page(self):
        response = self.client.get("/api/articles", params={"page": 1, "page_size": 2})
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["page"], 1)
        self.assertEqual(body["page_size"], 2)
        self.assertEqual(body["total"], 3)
        self.assertEqual(
            [item["title"] for item in body["items"]],
            ["Article 1", "Article 2"],
        )
        self.assertEqual(body["items"][0]["url"], "https://example.com/1")
        self.assertEqual(body["items"][0]["body"], "Body 1")
        self.assertIn("id", body["items"][0])
        self.assertIn("created_at", body["items"][0])

    def test_second_page(self):
        response = self.client.get("/api/articles", params={"page": 2, "page_size": 2})
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["total"], 3)
        self.assertEqual([item["title"] for item in body["items"]], ["Article 3"])

    def test_defaults(self):
        response = self.client.get("/api/articles")
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["page"], 1)
        self.assertEqual(body["page_size"], 20)
        self.assertEqual(body["total"], 3)
        self.assertEqual(len(body["items"]), 3)

    def test_page_past_the_end(self):
        response = self.client.get("/api/articles", params={"page": 5, "page_size": 2})
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["items"], [])
        self.assertEqual(body["total"], 3)

    def test_invalid_page_and_page_size(self):
        self.assertEqual(self.client.get("/api/articles", params={"page": 0}).status_code, 422)
        self.assertEqual(
            self.client.get("/api/articles", params={"page_size": 101}).status_code,
            422,
        )

    def test_search_matches_title_body_or_url(self):
        by_title = self.client.get("/api/articles", params={"q": "Article 2"}).json()
        self.assertEqual([item["title"] for item in by_title["items"]], ["Article 2"])
        by_body = self.client.get("/api/articles", params={"q": "Body 3"}).json()
        self.assertEqual([item["title"] for item in by_body["items"]], ["Article 3"])
        by_url = self.client.get("/api/articles", params={"q": "example.com/1"}).json()
        self.assertEqual([item["title"] for item in by_url["items"]], ["Article 1"])

    def test_search_is_case_insensitive_and_paginates(self):
        response = self.client.get(
            "/api/articles",
            params={"q": "article", "page": 1, "page_size": 2},
        )
        self.assertEqual(response.status_code, 200)
        body = response.json()
        self.assertEqual(body["total"], 3)
        self.assertEqual(len(body["items"]), 2)
        self.assertEqual(body["page"], 1)

    def test_blank_search_returns_every_article(self):
        body = self.client.get("/api/articles", params={"q": "   "}).json()
        self.assertEqual(body["total"], 3)

    def test_search_escapes_like_wildcards(self):
        response = self.client.get("/api/articles", params={"q": "%"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()["total"], 0)

    def test_dashboard_origin_is_allowed(self):
        response = self.client.get(
            "/api/articles",
            headers={"Origin": "http://localhost:5173"},
        )
        self.assertEqual(
            response.headers.get("access-control-allow-origin"),
            "http://localhost:5173",
        )

    def test_other_origins_are_not_allowed(self):
        response = self.client.get(
            "/api/articles",
            headers={"Origin": "https://example.com"},
        )
        self.assertIsNone(response.headers.get("access-control-allow-origin"))

    def test_preflight_from_dashboard(self):
        response = self.client.options(
            "/api/articles",
            headers={
                "Origin": "http://127.0.0.1:5173",
                "Access-Control-Request-Method": "GET",
            },
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(
            response.headers.get("access-control-allow-origin"),
            "http://127.0.0.1:5173",
        )
        self.assertIn("GET", response.headers.get("access-control-allow-methods", ""))

    def test_error_response_keeps_cors_headers(self):
        app.dependency_overrides.clear()
        previous = os.environ.pop("DATABASE_URL", None)
        try:
            response = self.client.get(
                "/api/articles",
                headers={"Origin": "http://localhost:5173"},
            )
        finally:
            if previous is not None:
                os.environ["DATABASE_URL"] = previous
        self.assertEqual(response.status_code, 503)
        self.assertEqual(
            response.headers.get("access-control-allow-origin"),
            "http://localhost:5173",
        )
        self.assertIn("DATABASE_URL", response.json()["detail"])

    def test_missing_database_url(self):
        app.dependency_overrides.clear()
        previous = os.environ.pop("DATABASE_URL", None)
        try:
            response = self.client.get("/api/articles")
        finally:
            if previous is not None:
                os.environ["DATABASE_URL"] = previous
        self.assertEqual(response.status_code, 503)
        self.assertIn("DATABASE_URL", response.json()["detail"])


if __name__ == "__main__":
    unittest.main()

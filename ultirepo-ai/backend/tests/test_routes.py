from fastapi.testclient import TestClient

from app.main import app

client = TestClient(app)


def test_health_check():
    response = client.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"


def test_upload_repo_rejects_non_github_url():
    response = client.post("/upload-repo", json={"repo_url": "https://gitlab.com/example/repo"})
    assert response.status_code == 400


def test_upload_repo_rejects_empty_url():
    response = client.post("/upload-repo", json={"repo_url": ""})
    assert response.status_code == 400


def test_process_status_404_for_unknown_repo():
    response = client.get("/process-status/does-not-exist")
    assert response.status_code == 404


def test_repo_stats_404_for_unknown_repo():
    response = client.get("/repo-stats/does-not-exist")
    assert response.status_code == 404


def test_chat_404_for_unindexed_repo():
    response = client.post("/chat", json={"repo_id": "does-not-exist", "question": "What does this do?"})
    assert response.status_code == 404

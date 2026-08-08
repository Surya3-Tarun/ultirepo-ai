from pathlib import Path

from app.services.repo_ingestion import walk_repository


def test_walk_repository_skips_ignored_dirs_and_extensions(tmp_path: Path):
    (tmp_path / "src").mkdir()
    (tmp_path / "src" / "main.py").write_text("print('hello')")
    (tmp_path / "node_modules").mkdir()
    (tmp_path / "node_modules" / "junk.js").write_text("var x = 1;")
    (tmp_path / "logo.png").write_bytes(b"\x89PNG\r\n")
    (tmp_path / "README.md").write_text("# Project")

    files = walk_repository(tmp_path)
    paths = {f.relative_path for f in files}

    assert "src/main.py" in paths
    assert "README.md" in paths
    assert not any("node_modules" in p for p in paths)
    assert "logo.png" not in paths


def test_walk_repository_skips_empty_files(tmp_path: Path):
    (tmp_path / "empty.py").write_text("   \n  ")
    (tmp_path / "real.py").write_text("x = 1")

    files = walk_repository(tmp_path)
    paths = {f.relative_path for f in files}

    assert "empty.py" not in paths
    assert "real.py" in paths

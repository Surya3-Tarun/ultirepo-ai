from app.services.chunking import chunk_file
from app.services.repo_ingestion import RepoFile


def test_chunk_file_splits_long_python_content():
    long_source = "\n".join(f"def function_{i}():\n    return {i}\n" for i in range(200))
    repo_file = RepoFile(relative_path="module.py", language="Python", content=long_source, size_bytes=len(long_source))

    chunks = chunk_file(repo_file)

    assert len(chunks) > 1
    assert all(chunk.file_path == "module.py" for chunk in chunks)
    assert all(chunk.start_line >= 1 for chunk in chunks)


def test_chunk_file_keeps_short_content_as_single_chunk():
    repo_file = RepoFile(relative_path="README.md", language="Markdown", content="# Hello\n\nShort readme.", size_bytes=25)

    chunks = chunk_file(repo_file)

    assert len(chunks) == 1
    assert chunks[0].content.strip().startswith("# Hello")


def test_chunk_ids_are_unique_per_file():
    content = "line\n" * 500
    repo_file = RepoFile(relative_path="big.txt", language="Text", content=content, size_bytes=len(content))

    chunks = chunk_file(repo_file)
    ids = [c.chunk_id for c in chunks]

    assert len(ids) == len(set(ids))

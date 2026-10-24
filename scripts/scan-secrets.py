#!/usr/bin/env python3
"""Scan repository files for common credential formats without printing values."""

from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path


PATTERNS: tuple[tuple[str, re.Pattern[bytes]], ...] = (
    (
        "telegram_bot_token",
        re.compile(rb"\b(?:bot)?[0-9]{6,12}(?::|\\u003a)[A-Za-z0-9_-]{30,}"),
    ),
    (
        "telegram_bot_api_url_with_token",
        re.compile(
            rb"api(?:\.|\\u002e)telegram(?:\.|\\u002e)org(?:/|\\/|\\u002f)bot[0-9]{6,12}"
            rb"(?::|\\u003a)[A-Za-z0-9_-]{30,}",
            re.IGNORECASE,
        ),
    ),
    (
        "cloud_secret_key",
        re.compile(rb"\bsb_secret_[A-Za-z0-9_-]{20,}\b"),
    ),
    (
        "provider_token",
        re.compile(rb"\b(?:gh[pousr]_[A-Za-z0-9_]{30,}|github_pat_[A-Za-z0-9_]{30,}|xox[baprs]-[A-Za-z0-9-]{20,})\b"),
    ),
    (
        "aws_access_key_id",
        re.compile(rb"\bAKIA[0-9A-Z]{16}\b"),
    ),
    (
        "private_key_block",
        re.compile(rb"-----BEGIN (?:RSA |EC |OPENSSH |DSA )?PRIVATE KEY-----"),
    ),
)


REPOSITORY_ROOT = Path(__file__).resolve().parents[1]


def repository_paths() -> list[Path]:
    raw = subprocess.check_output(
        ["git", "ls-files", "-z", "--cached", "--others", "--exclude-standard"],
        cwd=REPOSITORY_ROOT,
    )
    return [Path(value.decode("utf-8", "surrogateescape")) for value in raw.split(b"\0") if value]


def read_repository_file(root: Path, path: Path) -> bytes | None:
    root = root.resolve()
    if path.is_absolute() or ".." in path.parts:
        return None

    candidate = root / path
    parent = candidate
    while parent != root:
        if parent.is_symlink():
            return None
        parent = parent.parent

    try:
        resolved = candidate.resolve(strict=True)
        resolved.relative_to(root)
        if not resolved.is_file():
            return None
        return resolved.read_bytes()
    except (OSError, ValueError):
        return None


def main() -> int:
    findings: list[tuple[str, str, int]] = []
    for path in repository_paths():
        contents = read_repository_file(REPOSITORY_ROOT, path)
        if contents is None:
            continue
        if b"\0" in contents:
            continue
        for kind, pattern in PATTERNS:
            count = len(pattern.findall(contents))
            if count:
                findings.append((path.as_posix(), kind, count))

    if findings:
        print("Potential credentials found (values suppressed):")
        for path, kind, count in findings:
            print(f"{path}: {kind} ({count} match(es))")
        return 1

    print("Secret scan passed: no configured credential patterns found in repository files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())

import importlib.util
import os
import tempfile
import unittest
from pathlib import Path


MODULE_PATH = Path(__file__).with_name("scan-secrets.py")
SPEC = importlib.util.spec_from_file_location("secret_scanner", MODULE_PATH)
assert SPEC is not None and SPEC.loader is not None
SCANNER = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(SCANNER)


class RepositoryFileSafetyTests(unittest.TestCase):
    def test_skips_symlinks_and_paths_outside_repository(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary) / "repo"
            outside = Path(temporary) / "outside.txt"
            root.mkdir()
            outside.write_text("ordinary placeholder", encoding="utf-8")
            (root / "linked.txt").symlink_to(outside)

            self.assertIsNone(SCANNER.read_repository_file(root, Path("linked.txt")))
            self.assertIsNone(SCANNER.read_repository_file(root, Path("../outside.txt")))

    def test_skips_non_regular_files(self) -> None:
        with tempfile.TemporaryDirectory() as temporary:
            root = Path(temporary)
            fifo = root / "pipe"
            os.mkfifo(fifo)

            self.assertIsNone(SCANNER.read_repository_file(root, Path("pipe")))


if __name__ == "__main__":
    unittest.main()



SCRIPTS_DIR = Path(__file__).resolve().parents[1] / "src" / "scripts"


def load_module(name: str):
    spec = importlib.util.spec_from_file_location(name, SCRIPTS_DIR / f"{name}.py")
    module = importlib.util.module_from_spec(spec)
    sys.modules[name] = module
    spec.loader.exec_module(module)
    return module


report = load_module("report")
validate_links = load_module("validate_links")

SAMPLE = {
    "abc123": {"url": "https://example.com/a", "hits": 7, "createdAt": "2026-10-01T10:00:00.000Z"},
    "def456": {"url": "https://example.com/b", "hits": 2, "createdAt": "2026-10-05T10:00:00.000Z"},
    "ghi789": {"url": "https://github.com/x", "hits": 12, "createdAt": "2026-10-03T10:00:00.000Z"},
}


class ReportTests(unittest.TestCase):
    def test_top_links_orders_by_hits(self):
        codes = [code for code, _ in report.top_links(SAMPLE, 2)]
        self.assertEqual(codes, ["ghi789", "abc123"])

    def test_top_links_handles_n_larger_than_data(self):
        self.assertEqual(len(report.top_links(SAMPLE, 10)), 3)

    def test_hosts_breakdown_counts_per_host(self):
        counts = report.hosts_breakdown(SAMPLE)
        self.assertEqual(counts["example.com"], 2)
        self.assertEqual(counts["github.com"], 1)

    def test_oldest_link_uses_created_at(self):
        code, _ = report.oldest_link(SAMPLE)
        self.assertEqual(code, "abc123")

    def test_oldest_link_returns_none_when_undated(self):
        self.assertIsNone(report.oldest_link({"x": {"url": "https://a.com", "hits": 0}}))

    def test_format_report_includes_totals(self):
        text = report.format_report(SAMPLE, 1)
        self.assertIn("Links:       3", text)
        self.assertIn("Total hits:  21", text)
        self.assertIn("ghi789", text)

    def test_load_links_missing_file_returns_empty(self):
        self.assertEqual(report.load_links(Path(tempfile.gettempdir()) / "does-not-exist.json"), {})


class ValidateLinksTests(unittest.TestCase):
    def test_valid_sample_has_no_problems(self):
        self.assertEqual(validate_links.validate_links(SAMPLE), [])

    def test_rejects_bad_code(self):
        problems = validate_links.validate_links({"a!": SAMPLE["abc123"]})
        self.assertTrue(any("alphanumeric" in p for p in problems))

    def test_rejects_non_http_url(self):
        record = dict(SAMPLE["abc123"], url="ftp://example.com")
        problems = validate_links.validate_links({"abc123": record})
        self.assertTrue(any("http" in p for p in problems))

    def test_rejects_negative_hits_and_bad_timestamp(self):
        record = dict(SAMPLE["abc123"], hits=-1, createdAt="yesterday")
        problems = validate_links.validate_links({"abc123": record})
        self.assertEqual(len(problems), 2)

    def test_reports_missing_fields(self):
        problems = validate_links.validate_links({"abc123": {}})
        self.assertEqual(len(problems), 3)

    def test_rejects_non_object_top_level(self):
        self.assertEqual(len(validate_links.validate_links([])), 1)

    def test_main_returns_nonzero_for_invalid_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "links.json"
            path.write_text(json.dumps({"bad code": {}}), encoding="utf-8")
            self.assertEqual(validate_links.main([str(path)]), 1)

    def test_main_returns_zero_for_valid_file(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "links.json"
            path.write_text(json.dumps(SAMPLE), encoding="utf-8")
            self.assertEqual(validate_links.main([str(path)]), 0)


if __name__ == "__main__":
    unittest.main()

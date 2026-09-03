import json
from pathlib import Path
import unittest


class OpenAPITests(unittest.TestCase):
    def test_openapi_contract_is_valid_json_and_covers_public_routes(self):
        document = json.loads((Path(__file__).parent / "openapi.json").read_text(encoding="utf-8"))
        self.assertEqual(document["openapi"], "3.0.3")
        self.assertIn("/health", document["paths"])
        self.assertIn("/v1/decide", document["paths"])
        self.assertIn("/v1/decide/audited", document["paths"])
        self.assertIn("ApiKeyAuth", document["components"]["securitySchemes"])


if __name__ == "__main__":
    unittest.main()

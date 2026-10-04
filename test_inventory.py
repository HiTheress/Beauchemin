import json
import threading
import unittest
import urllib.error
import urllib.request
from http.server import ThreadingHTTPServer

from inventory import Inventory, ValidationError, make_handler


class InventoryTests(unittest.TestCase):
    def setUp(self):
        self.inv = Inventory(self._tmp())

    def _tmp(self):
        import tempfile, os
        fd, p = tempfile.mkstemp(suffix=".db")
        os.close(fd)
        self.addCleanup(os.remove, p)
        return p

    def test_crud(self):
        i = self.inv.create({"sku": "A1", "name": "Widget", "quantity": 10, "price": 2.5})
        self.assertEqual(self.inv.get(i["id"])["name"], "Widget")
        self.assertEqual(self.inv.update(i["id"], {"name": "Gadget"})["name"], "Gadget")
        self.assertTrue(self.inv.delete(i["id"]))
        self.assertIsNone(self.inv.get(i["id"]))

    def test_validation(self):
        self.inv.create({"sku": "A1", "name": "W"})
        for bad in ({"sku": "A1", "name": "dup"}, {"sku": "", "name": "x"}, {"sku": "B", "name": "x", "quantity": -1},
                    {"sku": "B", "name": "x", "price": "abc"}):
            with self.assertRaises(ValidationError):
                self.inv.create(bad)

    def test_adjust_cannot_go_negative(self):
        i = self.inv.create({"sku": "A1", "name": "W", "quantity": 2})
        self.assertEqual(self.inv.adjust(i["id"], -2)["quantity"], 0)
        with self.assertRaises(ValidationError):
            self.inv.adjust(i["id"], -1)
        self.assertIsNone(self.inv.adjust(999, 1))

    def test_search_low_stock_summary(self):
        self.inv.create({"sku": "A1", "name": "Widget", "quantity": 1, "price": 10, "reorder_level": 5})
        self.inv.create({"sku": "B2", "name": "Bolt", "quantity": 50, "price": 1})
        self.assertEqual([x["sku"] for x in self.inv.list("bol")], ["B2"])
        self.assertEqual([x["sku"] for x in self.inv.list(low_only=True)], ["A1"])
        s = self.inv.summary()
        self.assertEqual((s["items"], s["units"], s["value"], s["low_stock"]), (2, 51, 60, 1))


class ApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        import tempfile, os
        cls.path = os.path.join(tempfile.mkdtemp(), "t.db")
        cls.srv = ThreadingHTTPServer(("127.0.0.1", 0), make_handler(Inventory(cls.path)))
        cls.base = f"http://127.0.0.1:{cls.srv.server_port}"
        threading.Thread(target=cls.srv.serve_forever, daemon=True).start()

    @classmethod
    def tearDownClass(cls):
        cls.srv.shutdown()

    def call(self, method, path, body=None):
        req = urllib.request.Request(self.base + path, method=method,
                                     data=body is not None and json.dumps(body).encode() or None)
        try:
            with urllib.request.urlopen(req) as r:
                raw = r.read()
                return r.status, json.loads(raw) if raw else None
        except urllib.error.HTTPError as e:
            return e.code, json.loads(e.read() or b"null")

    def test_flow(self):
        st, item = self.call("POST", "/api/items", {"sku": "X", "name": "Thing", "quantity": 3})
        self.assertEqual(st, 201)
        self.assertEqual(self.call("POST", f"/api/items/{item['id']}/adjust", {"delta": 4})[1]["quantity"], 7)
        self.assertEqual(self.call("POST", f"/api/items/{item['id']}/adjust", {"delta": -99})[0], 400)
        self.assertEqual(self.call("POST", "/api/items", {"sku": "X", "name": "dup"})[0], 400)
        self.assertEqual(self.call("DELETE", f"/api/items/{item['id']}")[0], 204)
        self.assertEqual(self.call("GET", f"/api/items/{item['id']}")[0], 404)

    def test_index_served(self):
        with urllib.request.urlopen(self.base + "/") as r:
            self.assertIn(b"<title>Inventory</title>", r.read())


if __name__ == "__main__":
    unittest.main()

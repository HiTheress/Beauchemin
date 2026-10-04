"""Simple inventory management system: SQLite storage + JSON API + web UI.

Run:  python3 inventory.py [--port 8000] [--db inventory.db]
"""
import argparse
import json
import sqlite3
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

STATIC = Path(__file__).parent / "static"


class ValidationError(ValueError):
    pass


class Inventory:
    """Data layer. Each call opens its own connection, so it is thread-safe."""

    def __init__(self, path):
        self.path = path
        with self._conn() as c:
            c.execute(
                """CREATE TABLE IF NOT EXISTS items (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    sku TEXT NOT NULL UNIQUE,
                    name TEXT NOT NULL,
                    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
                    price REAL NOT NULL DEFAULT 0 CHECK (price >= 0),
                    reorder_level INTEGER NOT NULL DEFAULT 5 CHECK (reorder_level >= 0)
                )"""
            )

    def _conn(self):
        c = sqlite3.connect(self.path)
        c.row_factory = sqlite3.Row
        return c

    @staticmethod
    def _clean(data, partial=False):
        out = {}
        for key in ("sku", "name"):
            if key in data or not partial:
                v = str(data.get(key, "")).strip()
                if not v:
                    raise ValidationError(f"{key} is required")
                out[key] = v
        for key, cast in (("quantity", int), ("price", float), ("reorder_level", int)):
            if key in data:
                try:
                    v = cast(data[key])
                except (TypeError, ValueError):
                    raise ValidationError(f"{key} must be a number")
                if v < 0:
                    raise ValidationError(f"{key} cannot be negative")
                out[key] = v
        return out

    def list(self, q="", low_only=False):
        sql, args = "SELECT * FROM items", []
        where = []
        if q:
            where.append("(name LIKE ? OR sku LIKE ?)")
            args += [f"%{q}%"] * 2
        if low_only:
            where.append("quantity <= reorder_level")
        if where:
            sql += " WHERE " + " AND ".join(where)
        with self._conn() as c:
            return [dict(r) for r in c.execute(sql + " ORDER BY name COLLATE NOCASE", args)]

    def get(self, item_id):
        with self._conn() as c:
            r = c.execute("SELECT * FROM items WHERE id=?", (item_id,)).fetchone()
        return dict(r) if r else None

    def create(self, data):
        d = self._clean(data)
        try:
            with self._conn() as c:
                cur = c.execute(
                    "INSERT INTO items (sku, name, quantity, price, reorder_level) VALUES (?,?,?,?,?)",
                    (d["sku"], d["name"], d.get("quantity", 0), d.get("price", 0), d.get("reorder_level", 5)),
                )
            return self.get(cur.lastrowid)
        except sqlite3.IntegrityError:
            raise ValidationError(f"SKU '{d['sku']}' already exists")

    def update(self, item_id, data):
        d = self._clean(data, partial=True)
        if not d:
            raise ValidationError("nothing to update")
        sets = ", ".join(f"{k}=?" for k in d)
        try:
            with self._conn() as c:
                cur = c.execute(f"UPDATE items SET {sets} WHERE id=?", [*d.values(), item_id])
        except sqlite3.IntegrityError:
            raise ValidationError("SKU already exists")
        return self.get(item_id) if cur.rowcount else None

    def adjust(self, item_id, delta):
        """Atomically add/remove stock; refuses to go below zero."""
        try:
            delta = int(delta)
        except (TypeError, ValueError):
            raise ValidationError("delta must be an integer")
        with self._conn() as c:
            cur = c.execute(
                "UPDATE items SET quantity = quantity + ? WHERE id=? AND quantity + ? >= 0",
                (delta, item_id, delta),
            )
        if not cur.rowcount:
            if self.get(item_id) is None:
                return None
            raise ValidationError("not enough stock")
        return self.get(item_id)

    def delete(self, item_id):
        with self._conn() as c:
            return c.execute("DELETE FROM items WHERE id=?", (item_id,)).rowcount > 0

    def summary(self):
        with self._conn() as c:
            r = c.execute(
                """SELECT COUNT(*) AS items, COALESCE(SUM(quantity),0) AS units,
                          COALESCE(SUM(quantity*price),0) AS value,
                          COALESCE(SUM(quantity <= reorder_level),0) AS low_stock FROM items"""
            ).fetchone()
        return dict(r)


def make_handler(inv):
    class Handler(BaseHTTPRequestHandler):
        def _send(self, status, body, ctype="application/json"):
            payload = body if isinstance(body, bytes) else json.dumps(body).encode()
            self.send_response(status)
            self.send_header("Content-Type", ctype)
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)

        def _body(self):
            try:
                n = int(self.headers.get("Content-Length") or 0)
                data = json.loads(self.rfile.read(n) or b"{}")
            except (ValueError, json.JSONDecodeError):
                raise ValidationError("invalid JSON")
            if not isinstance(data, dict):
                raise ValidationError("JSON object expected")
            return data

        def _route(self, method):
            from urllib.parse import urlparse, parse_qs

            u = urlparse(self.path)
            parts = [p for p in u.path.split("/") if p]
            qs = parse_qs(u.query)
            try:
                if method == "GET" and not parts:
                    return self._send(200, (STATIC / "index.html").read_bytes(), "text/html; charset=utf-8")
                if parts[:2] == ["api", "summary"] and method == "GET":
                    return self._send(200, inv.summary())
                if parts[:2] == ["api", "items"]:
                    if len(parts) == 2:
                        if method == "GET":
                            return self._send(200, inv.list(qs.get("q", [""])[0], qs.get("low", ["0"])[0] == "1"))
                        if method == "POST":
                            return self._send(201, inv.create(self._body()))
                    elif len(parts) in (3, 4) and parts[2].isdigit():
                        iid = int(parts[2])
                        if len(parts) == 4 and parts[3] == "adjust" and method == "POST":
                            item = inv.adjust(iid, self._body().get("delta"))
                        elif len(parts) == 3 and method == "GET":
                            item = inv.get(iid)
                        elif len(parts) == 3 and method == "PUT":
                            item = inv.update(iid, self._body())
                        elif len(parts) == 3 and method == "DELETE":
                            return self._send(204, b"") if inv.delete(iid) else self._send(404, {"error": "not found"})
                        else:
                            return self._send(405, {"error": "method not allowed"})
                        return self._send(200, item) if item else self._send(404, {"error": "not found"})
                self._send(404, {"error": "not found"})
            except ValidationError as e:
                self._send(400, {"error": str(e)})

        do_GET = lambda self: self._route("GET")
        do_POST = lambda self: self._route("POST")
        do_PUT = lambda self: self._route("PUT")
        do_DELETE = lambda self: self._route("DELETE")

        def log_message(self, fmt, *args):
            sys.stderr.write("%s %s\n" % (self.command, self.path))

    return Handler


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--db", default="inventory.db")
    a = ap.parse_args()
    server = ThreadingHTTPServer((a.host, a.port), make_handler(Inventory(a.db)))
    print(f"Inventory running at http://{a.host}:{a.port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass


if __name__ == "__main__":
    main()

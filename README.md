# Inventory Management System

A small web app for tracking stock. Python standard library only (no installs).

    python3 inventory.py            # http://127.0.0.1:8000, data in inventory.db
    python3 inventory.py --port 9000 --db shop.db
    python3 -m unittest             # run tests

Features: add/edit/delete items, +/- stock adjustment (never below zero), search,
low-stock highlighting (quantity <= reorder level), and totals (items, units, stock value).

## API
| Method | Path | Notes |
|---|---|---|
| GET | `/api/items?q=&low=1` | list/search |
| POST | `/api/items` | `{sku, name, quantity, price, reorder_level}` |
| GET/PUT/DELETE | `/api/items/<id>` | |
| POST | `/api/items/<id>/adjust` | `{delta: int}` |
| GET | `/api/summary` | totals |

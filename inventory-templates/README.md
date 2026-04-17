# Inventory import template

Use these files to bulk-create or update rows in the `parts` table via **Admin → Import** (or `POST /api/v1/admin/parts/import`).

## Files

- **`inventory_import_template.csv`** — UTF-8 CSV with a header row. Safe to edit in Excel; use **Save As → CSV UTF-8** if Excel changes encoding.
- You can also save the same sheet as **`.xlsx`**; the API accepts `.csv` or `.xlsx` with the same column headers.

## Columns

| Column | Required | Notes |
|--------|----------|--------|
| `part_number` | Yes | Unique part identifier (matches site search). |
| `name` | Yes | Display name. |
| `description` | No | Free text. |
| `category_slug` | No | Must match an existing category `slug` (e.g. `ct`, `pet`, `general`). Leave empty for uncategorized. |
| `stock_quantity` | No | Integer; defaults to `0`. |
| `price` | No | Decimal; optional. |
| `status` | No | e.g. `in_stock`, `out_of_stock` (must fit DB string length). |

## Behaviour

- **Upsert key:** `part_number`. If a part exists, the row **updates** it; otherwise it **creates** it.
- **Dry run:** In the admin UI, enable **Dry run** to validate rows without writing.
- **Categories:** Create categories first under **Admin → Categories** so `category_slug` values resolve.

When Titan Imaging confirms final fields, we can add columns or adjust the schema in a follow-up migration.

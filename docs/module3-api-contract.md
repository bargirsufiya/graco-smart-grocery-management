# Module 3 API Contract

With no `VITE_API_URL` configured, the React app runs in browser demo mode and stores user-entered Module 3 records in this browser's `localStorage`. Those records are not in MongoDB and are not shared across browsers. To use a backend, set `VITE_API_URL` to the API base URL (for example, `http://localhost:5000/api`). When configured, the app uses the API only and does not fall back to local storage if a request fails. Requests include cookie credentials. No MongoDB connection or Express server is included in this frontend workspace.

The backend should authenticate requests using the project's existing middleware and scope every query and mutation to the authenticated user. Do not trust a client-supplied user ID for access control.

## Inventory

- `GET /inventory` returns an array of inventory records.
- `POST /inventory` accepts `{ name, category, quantity, unit, purchasePrice, expiryDate, lowStockThreshold }` and returns the created record.
- `PATCH /inventory/:id` accepts editable inventory fields and returns the updated record.
- `DELETE /inventory/:id` deletes the authenticated user's record and may return `204 No Content`.

## Expenses

- `GET /expenses?month=YYYY-MM` returns the authenticated user's expenses for that month.
- `POST /expenses` accepts `{ title, amount, category, date, quantity, notes }` and returns the created record.
- `PATCH /expenses/:id` accepts editable expense fields and returns the updated record.
- `DELETE /expenses/:id` deletes the authenticated user's record and may return `204 No Content`.

## Monthly Budget

- `GET /budgets?month=YYYY-MM` returns the budget record for that user and month, or `null` if one has not been set.
- `PUT /budgets/YYYY-MM` accepts `{ month, amount }` and creates or updates that user's budget for the month.

Successful JSON list responses may be a bare array or an object with an `items`, `records`, or array-valued `data` property. A single-record response may be a bare record or an object with `item`, `expense`, `budget`, or `data`. Records should expose MongoDB `_id` or `id`; the client normalizes `_id` to `id`. Return useful JSON error messages with an appropriate non-2xx status for failed requests.

Recommended MongoDB constraints are a unique `(userId, month)` index for budgets and indexes on `(userId, date)` for expenses and `userId` for inventory. Validate positive expense amounts and non-negative inventory quantities/prices/thresholds on the server as well as in the UI.
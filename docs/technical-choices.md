# Technical choices

The reasoning behind each choice. The short version is in the [README](../README.md#technical-choices).

- **Server-side rendering with Vite, no meta-framework.** Product HTML is in the first response, without waiting for JavaScript. Client-side rendering and static generation were rejected ([#5](https://github.com/samkeller/c4sf-kata/issues/5)).
- **TypeScript everywhere.** The server runs as TypeScript directly on Node 24, so it needs no separate build.
- **PrimeVue 4 with the Aura preset.** A ready-made component library keeps time on features rather than CSS ([#9](https://github.com/samkeller/c4sf-kata/issues/9)).
  - Version 4 because it is MIT; version 5 requires a commercial licence key.
  - Component styles are inlined in the server-rendered HTML, so the page does not flash unstyled before hydration.
- **TanStack Vue Query for data, prefetched during server rendering** ([#6](https://github.com/samkeller/c4sf-kata/issues/6)).
  - Each request gets its own query client. The server calls the catalogue directly instead of its own HTTP API; the browser calls `/api/products`.
  - The query cache, errors included, is serialised into a `<script type="application/json">` and restored before the app mounts, so the page does not fetch again.
  - Data stays fresh for 5 minutes and cached for 30. The browser retries twice on network errors and 5xx, 408 or 429 responses; the server does not retry, so a failing API cannot delay the HTML.
- **The cart lives in the browser, updated optimistically** ([#7](https://github.com/samkeller/c4sf-kata/issues/7)).
  - A change shows at once and is saved to `localStorage` (`cart:v1`), then the whole cart is sent to `PUT /api/cart`. Only the answer to the latest request counts; if it fails, the cart rolls back to the last confirmed state and a toast says so. A queue with replay was rejected as too much for a cart that is never paid.
  - The Pinia store holds the transitions and a `status` of `idle`, `syncing` or `error`. The rules (add, quantity, totals) are pure functions, tested without Vue.
  - Stored data is checked with Zod on read: corrupt or outdated data gives an empty cart. The same schema validates the request body on the server.
  - The server never sees `localStorage`, so the cart is restored right after hydration and the server-rendered HTML always matches the first client render.
  - Tabs stay in sync through the `storage` event; the last write wins.
  - Leaving or reloading the page cancels a pending confirmation. That is not a refusal, so it does not roll back: otherwise a reload right after a change would erase it. The end-to-end test reproduces this case.
  - `/cart` and the mini-cart content are lazy-loaded; they share their line and summary components.
- **The server filters an in-memory catalogue.** DummyJSON has no price filter, and its search ignores categories. So the server loads the whole trimmed catalogue in one call, keeps it for 5 minutes, and applies search, category, price and pagination itself ([#8](https://github.com/samkeller/c4sf-kata/issues/8)).
  - This assumes a small catalogue: DummyJSON has 194 products. A real catalogue would move this work to a search engine or to the API.
  - Concurrent requests share one upstream call, and a failed call is not cached.
- **Upstream data is validated.** DummyJSON responses are checked with Zod and mapped to our own `Product` type. One invalid product rejects the whole response, with an explicit error, rather than showing a partial catalogue.
- **Vitest, ESLint and Prettier**, with CI as the safety net.

All decisions, with the alternatives considered, are recorded in [issue #1](https://github.com/samkeller/c4sf-kata/issues/1).

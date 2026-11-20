# E-shop Gallery

A product gallery with a shopping cart, built with Vue 3 and server-side rendering, without a meta-framework. The brief is in [`docs/Instruction.md`](docs/Instruction.md).

The project was built in slices; the plan and progress are tracked in [issue #12](https://github.com/samkeller/c4sf-kata/issues/12).

## Features

- **Product list**, rendered on the server: the products are in the first HTML response, then the page hydrates.
- **Search, category and price filters, pagination.** Everything lives in the URL: a link can be shared, back and forward work, and a filtered URL renders on the server. Matches are highlighted.
- **Cart** with a mini-cart in the header and a `/cart` page. Changes show at once and are confirmed by the server; if that fails, the cart rolls back and a message says so. The cart survives reloads and browser restarts, and stays in sync across tabs.

The products come from [DummyJSON](https://dummyjson.com). Nothing is paid: there is no checkout.

## Getting started

Requires Node.js 24 or newer (see `.nvmrc`).

```sh
npm ci
npm run dev        # http://localhost:5176
```

Production build:

```sh
npm run build
npm run preview    # http://localhost:5176
```

Set `PORT` to use another port.

## Tests and checks

| Command                | What it does                                         |
| ---------------------- | ---------------------------------------------------- |
| `npm run typecheck`    | TypeScript, strict mode                              |
| `npm run lint`         | ESLint                                               |
| `npm run format:check` | Prettier                                             |
| `npm test`             | Vitest: unit tests and one integration test          |
| `npm run build`        | Client and server production builds                  |
| `npm run test:e2e`     | Playwright, against the production build (port 5180) |
| `npm run analyze`      | Bundle map in `dist/stats.html`                      |

CI runs the first five on every push and pull request (`.github/workflows/ci.yml`).

- **Unit tests** cover the business rules (cart, filtering), the mappers and the server rendering.
- **The integration test** feeds a DummyJSON response through the real mapper, cache, filter and server rendering, and checks the HTML.
- **Two end-to-end journeys**: the product list is in the server HTML (checked with JavaScript disabled), and a product added to the cart is still there after a reload. The first time, install the browser with `npx playwright install chromium`. They call the real DummyJSON, so they stay out of CI: an outage there would fail the build for no fault of ours.

## Architecture

```text
app/       Vue app, rendered on the server and hydrated in the browser
server/    Express server: SSR, upstream API access, /api routes
shared/    Code used by both app/ and server/, imported as #shared/<file>.ts
e2e/       Playwright journeys
```

Each feature lives in `app/<feature>/` and follows a simple MVC split:

- `api/`: data access and validation;
- `domain/`: types and business rules;
- `state/`: stores and composables;
- `ui/`: components.

UI components never call `api/` directly; ESLint enforces this. Everything specific to DummyJSON stays in `server/dummyjson/`.

The server exposes `GET /api/products` and `PUT /api/cart`: see [`docs/API.md`](docs/API.md).

## Technical choices

- **Hand-rolled Vite SSR, no meta-framework**: product HTML is in the first response.
- **TanStack Vue Query**, prefetched on the server and hydrated in the browser: no second fetch.
- **The cart lives in the browser**: optimistic updates, rollback on failure, `localStorage`, synced across tabs.
- **The URL holds the search and filters**: links can be shared, back and forward work, and the server renders a filtered URL directly.
- **The server filters an in-memory catalogue**: fine for DummyJSON's 194 products.
- **Zod at every boundary**: upstream API, request bodies, `localStorage`.
- **PrimeVue 4 (MIT) and Tailwind**: ready-made components, no custom CSS.

Details and trade-offs: [`docs/technical-choices.md`](docs/technical-choices.md). Decisions and rejected alternatives: [issue #1](https://github.com/samkeller/c4sf-kata/issues/1).

## Known limits

- **Small catalogue assumed.** The server loads all 194 DummyJSON products and filters them in memory. A real catalogue would need a search engine or an API that filters.
- **No stale data on error.** The catalogue is cached for 5 minutes; if DummyJSON is down when the cache expires, the list shows an error with a retry button instead of the previous data.
- **Cart prices are snapshots** taken when the product was added. A price that changed since is not updated, which is acceptable since nothing is paid.
- **Between tabs, the last change wins.** Two tabs editing the cart at the same moment do not merge their changes.
- **DummyJSON only simulates the cart confirmation.** It does not check product ids; our Zod validation is the real guard. Nothing is stored on the server.
- **An unknown URL shows the home page** with a 200, not a 404.

## In production

- **HTTPS** belongs to the reverse proxy. The Content Security Policy is on in production only (Vite's dev server needs inline scripts); `upgrade-insecure-requests` is off so the local demo works over HTTP.
- **Several instances** would each keep their own catalogue cache. A shared cache (Redis) or HTTP caching in front of the API would fix that.
- **`PUT /api/cart`** would need rate limiting, and the `X-Simulate-Failure` header used for the demo should be removed.
- **Observability**: logs go to the console. Structured logs, error tracking and Core Web Vitals monitoring would come next.
- **Static assets** have hashed names and could be served with long-lived cache headers.

## Going further

- **Measure performance.** Not measured yet. On the production build: `npm run build && npm run preview`, then `npx lighthouse http://localhost:5176 --only-categories=performance` (mobile profile by default).
- **Lighter bundle.** About 180 kB of gzipped JavaScript on first load. PrimeVue and its Aura preset are most of it, the price of styled components. Zod adds about 36 kB in the browser, where it only reads the URL and `localStorage`; `zod/mini` would cut most of that.
- **More end-to-end journeys** (filters and back button, forced cart failure) and Playwright in CI, against a stubbed upstream.
- **Serve stale data** when DummyJSON fails, rather than an error.

## Working with AI agents

- [`AGENTS.md`](AGENTS.md): conventions, architecture rules and verification steps for coding agents.
- [`docs/CONTEXT.md`](docs/CONTEXT.md): the domain vocabulary.
- `.mcp.json`: PrimeVue documentation server.

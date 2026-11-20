# E-shop Gallery

A product gallery with a shopping cart, built with Vue 3 and server-side rendering, without a meta-framework. The brief is in [`docs/Instruction.md`](docs/Instruction.md).

The project is built in slices; the plan and progress are tracked in [issue #12](https://github.com/samkeller/c4sf-kata/issues/12).

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

## API

`GET /api/products` (catalogue) and `PUT /api/cart` (cart confirmation): see [`docs/API.md`](docs/API.md).

## Quality checks

| Command                | Checks                              |
| ---------------------- | ----------------------------------- |
| `npm run typecheck`    | TypeScript, strict mode             |
| `npm run lint`         | ESLint                              |
| `npm run format:check` | Prettier                            |
| `npm test`             | Vitest unit tests                   |
| `npm run build`        | Client and server production builds |

CI runs the same commands on every push and pull request (`.github/workflows/ci.yml`).

## Architecture

```text
app/       Vue app, rendered on the server and hydrated in the browser
server/    Express server: SSR, upstream API access, /api routes
shared/    Code used by both app/ and server/, imported as #shared/<file>.ts
```

Each feature lives in `app/<feature>/` and follows a simple MVC split:

- `api/`: data access and validation;
- `domain/`: types and business rules;
- `state/`: stores and composables;
- `ui/`: components.

UI components never call `api/` directly; ESLint enforces this.

## Technical choices

- **Hand-rolled Vite SSR, no meta-framework**: product HTML is in the first response.
- **TanStack Vue Query**, prefetched on the server and hydrated in the browser: no second fetch.
- **The cart lives in the browser**: optimistic updates, rollback on failure, `localStorage`, synced across tabs.
- **The server filters an in-memory catalogue**: fine for DummyJSON's 194 products.
- **Zod at every boundary**: upstream API, request bodies, `localStorage`.
- **PrimeVue 4 (MIT) and Tailwind**: ready-made components, no custom CSS.
- **Vitest, ESLint, Prettier and CI.**

Details and trade-offs: [`docs/technical-choices.md`](docs/technical-choices.md). Decisions and rejected alternatives: [issue #1](https://github.com/samkeller/c4sf-kata/issues/1).

## Working with AI agents

- [`AGENTS.md`](AGENTS.md): conventions, architecture rules and verification steps for coding agents.
- [`docs/CONTEXT.md`](docs/CONTEXT.md): the domain vocabulary.
- `.mcp.json`: PrimeVue documentation server.

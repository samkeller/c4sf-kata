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
shared/    Code used by both app/ and server/
```

Each feature lives in `app/<feature>/` and follows a simple MVC split:

- `api/`: data access and validation;
- `domain/`: types and business rules;
- `state/`: stores;
- `ui/`: components.

UI components never call `api/` directly; ESLint enforces this.

## Technical choices

- **Server-side rendering with Vite, no meta-framework.** Product HTML is in the first response, without waiting for JavaScript. Client-side rendering and static generation were rejected ([#5](https://github.com/samkeller/c4sf-kata/issues/5)).
- **TypeScript everywhere.** The server runs as TypeScript directly on Node 24, so it needs no separate build.
- **PrimeVue 4 with the Aura preset.** A ready-made component library keeps time on features rather than CSS ([#9](https://github.com/samkeller/c4sf-kata/issues/9)).
  - Version 4 because it is MIT; version 5 requires a commercial licence key.
  - Component styles are inlined in the server-rendered HTML, so the page does not flash unstyled before hydration.
- **Vitest, ESLint and Prettier**, with CI as the safety net.

All decisions, with the alternatives considered, are recorded in [issue #1](https://github.com/samkeller/c4sf-kata/issues/1).

## Working with AI agents

- [`AGENTS.md`](AGENTS.md): conventions, architecture rules and verification steps for coding agents.
- [`docs/CONTEXT.md`](docs/CONTEXT.md): the domain vocabulary.
- `.mcp.json`: PrimeVue documentation server.
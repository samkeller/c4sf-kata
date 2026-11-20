# AGENTS.md

E-shop product gallery with a cart: Vue 3 server-side rendering on Express, no meta-framework. The kata brief is `docs/Instruction.md`.

- **Vocabulary:** `docs/CONTEXT.md`. Use its terms in code, tests and docs.
- **Decisions** and the alternatives they rejected live in the GitHub issues: map #1, build slices #12. Read the relevant one before changing architecture.

## Layout

- `app/`: the Vue app, rendered on the server and hydrated in the browser. `main.ts` creates the app; `entry-server.ts` and `entry-client.ts` are the two entries.
- `server/`: Express. Handles SSR, upstream API access and `/api/*`. Node 24 runs this TypeScript directly (type stripping), so use erasable syntax only and end relative imports in `.ts`.
- `shared/`: code imported by both `app/` and `server/`.

Features live in `app/<feature>/` and follow simple MVC:

- `api/`: HTTP calls, Zod schemas and mappers to domain types. API response shapes stay inside `api/`.
- `domain/`: types and pure business rules (the model), plain TypeScript without Vue.
- `state/`: stores and composables (the controller). The UI reaches data through here.
- `ui/`: components (the view). They render state and forward user intent to `state/`. ESLint fails any `ui/` import of `api/`.

Create a sub-folder when its first file arrives.

## Rules

- **SSR isolation:** each request gets its own app from `createApp()`, so per-user state lives inside it. Browser APIs (`window`, `localStorage`) run in `onMounted` or client-only code. The cart is client-only.
- **Boundaries:** data entering from the upstream API, `localStorage` or a request body is validated with Zod and mapped to domain types.
- **Proportion:** add an abstraction or a dependency when a current requirement needs it.
- **Tests:** Vitest, colocated as `*.test.ts`. Target behaviour (business rules, mappers, URL-state parsing), not coverage.
- **Comments** are in French and explain why. JSDoc is for non-obvious contracts.

## UI: PrimeVue 4

- PrimeVue 4.5 with the Aura preset, MIT. Stay on 4.x: v5 is commercially licensed and needs a key.
- Customise through design tokens and component props.
- Docs for v4: the `primevue` MCP server (`.mcp.json`) or https://v4.primevue.org/llms/llms.txt. primevue.org documents v5.
- `.mcp.json` pins `@modelcontextprotocol/sdk@1.25.2` because newer SDKs crash `@primevue/mcp@4.5.5` on start.
- SSR styles are automatic: `app/entry-server.ts` inlines the CSS of every PrimeVue component that rendered.

## Verify

Work is done when this chain is green, which is also what CI runs:

```sh
npm run typecheck && npm run lint && npm run format:check && npm test && npm run build
```

After a change that touches rendering, also run `npm run dev` (http://localhost:5176):

- the markup shows in view-source;
- the browser console has no hydration warning.

**Windows:** run commands from a working directory with an uppercase drive letter (`cd /D/...` in Git Bash). From `d:\`, Vitest loads twice and every suite fails with "failed to find the current suite".

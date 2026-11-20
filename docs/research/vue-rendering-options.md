# Vue 3 rendering options without a meta-framework

Research notes for issue #3. Question: how to render the product list page (PLP) with Vue 3 + TS, without Nuxt or something like it, within a ~4h total budget for the whole app. The PLP needs "SSR or advanced client-side optimization patterns" and "sub-second initial paint". The cart needs "persistence across browser sessions".

Sources were read on 2026-11-20. vuejs.org, vite.dev, vike.dev and web.dev were blocked from this environment, so the Vue, Vite, Vike and MDN docs were read from their GitHub source repos, which hold the same text. Links below point to the published pages. dummyjson.com and fakestoreapi.com were also unreachable, so **no latency was measured**: every time figure below is an estimate.

## Comparison

| | A. Hand-rolled Vite SSR (non-streaming) | A'. Same, streaming | B. Prerender (vite-ssg) + client refresh | C. Optimized SPA | D. Vike (+ vike-vue) |
|---|---|---|---|---|---|
| Build cost (estimate) | ~1–1.5h, starting from the `ssr-vue-ts` template | +0.5–1h on top of A | ~0.5–1h | ~0.5h | ~1h, plus learning its conventions |
| What the first HTML holds | Full product grid, fresh on each request | Same, sent in chunks | Full product grid as of build time | Shell + skeleton | Full grid |
| Hydration | Full `createSSRApp` hydration | Same | Same | None (`createApp` mount) | Same |
| Server→client state | You serialize it yourself: `pinia.state.value` or Vue Query `dehydrate()` into the HTML | Same, but the state can only be written **after** the stream ends | `initialState` (JSON by default), restored in the client setup fn | None needed | `vike-vue-pinia` / `vike-vue-query` extensions |
| Dev experience | `node server` with Vite in middleware mode; HMR works; you own the server-only reload | Same | Plain `vite` dev (SPA); SSR runs only at build | Plain `vite` | `vike dev`, file-based `+config` conventions |
| Build / serve | `vite build` (client) + `vite build --ssr` (server) + Node server | Same | `vite-ssg build` → static `dist/` | `vite build` → static `dist/` | `vike build`, then a server or prerender |
| Security headers | Express/Hono middleware, on every response | Same, but they must be set before the first byte | Static host or reverse-proxy config; `vite preview` has `preview.headers` | Same as B | `+headersResponse` (beta) or your server |
| Hydration-mismatch risk from a localStorage cart | High unless the cart UI is client-only | Same | Same (the server can never see the cart) | None (no hydration) | Same as A |
| Supports a "sub-second paint" claim? | Strongest: content in the first response; TTFB depends on API latency, so add a server cache | Same, with a slightly earlier head flush | Very strong for paint, but the data is stale until the client refresh | FCP yes (skeleton); content paint waits on JS + API round trip | Same as A |
| Rule risk ("no meta-frameworks") | None | None | Low (an SSG tool, not an app framework) | None | **High**: its README says "Replaces Next.js/Nuxt" |

## Key facts (with sources)

### Vue SSR basics
- Hydration: on the client, use `createSSRApp()` instead of `createApp()`. Vue "creates the same Vue application that was run on the server, matches each component to the DOM nodes it should control, and attaches DOM event listeners." ([Vue SSR guide – Client Hydration](https://vuejs.org/guide/scaling-up/ssr#client-hydration))
- Hydration is all or nothing per app, except that Vue 3.5+ async components can defer it with `hydrateOnIdle()`, `hydrateOnVisible()` and similar. ([Vue – Lazy Hydration](https://vuejs.org/guide/components/async#lazy-hydration)) For a grid of 20–30 cards this is not worth the effort.
- On a mismatch, Vue "will attempt to automatically recover and adjust the pre-rendered DOM", discarding and re-mounting nodes at some performance cost. Vue 3.5+ can suppress a known mismatch with `data-allow-mismatch="text|children|class|style|attribute"`. ([guide](https://vuejs.org/guide/scaling-up/ssr#hydration-mismatch), [API](https://vuejs.org/api/ssr#data-allow-mismatch))
- The recommended fix for browser-only values is `v-if` + `onMounted`, which renders that part only on the client. `onMounted` is not called during SSR. ([guide](https://vuejs.org/guide/scaling-up/ssr#hydration-mismatch))
- Cross-request state pollution: create a new app, router and store per request. "State Management libraries like Pinia are designed with this in mind." ([guide](https://vuejs.org/guide/scaling-up/ssr#cross-request-state-pollution))
- The Vue docs themselves say a production SSR setup "would be quite complex" and recommend frameworks. The cost is mostly in routing, data fetching, asset links and two builds. ([guide – Higher Level Solutions](https://vuejs.org/guide/scaling-up/ssr#higher-level-solutions))
- `onServerPrefetch(cb)`: "the server renderer will wait until the Promise is resolved before rendering the component." This is how data gets into SSR output without a framework. ([API](https://vuejs.org/api/composition-api-lifecycle#onserverprefetch))
- Streaming APIs: `renderToNodeStream`, `pipeToNodeWritable`, `renderToWebStream`, `pipeToWebWritable`, `renderToSimpleStream`. ([SSR API](https://vuejs.org/api/ssr)) The docs promise no out-of-order or Suspense-boundary streaming, so for a page whose content waits on one fetch, streaming mostly lets `<head>` and CSS flush early. (This last point is my inference.)
- SSG "retains the same performance characteristics" as SSR but "can only be applied to pages providing static data". ([guide – SSR vs. SSG](https://vuejs.org/guide/scaling-up/ssr#ssr-vs-ssg))

### Vite SSR (option A)
- The Vite guide calls its SSR support a "Low-level API meant for library and framework authors", but adds that "many applications are successfully built directly on top of Vite's native low-level API." ([Vite SSR guide](https://vite.dev/guide/ssr))
- Structure: `index.html` with an `<!--ssr-outlet-->` placeholder, `entry-client`, `entry-server`, and `server.js`. In dev, Vite runs in `middlewareMode` with `appType: 'custom'`, and the server uses `transformIndexHtml`, `ssrLoadModule`, and `ssrFixStacktrace`. In prod, build with `vite build --outDir dist/client` and `vite build --ssr src/entry-server.js --outDir dist/server`. ([Vite SSR guide](https://vite.dev/guide/ssr#setting-up-the-dev-server))
- By default, changing an SSR-only module does not reload the browser in a custom setup. The guide gives an `ssrReload()` plugin for that. ([same](https://vite.dev/guide/ssr#setting-up-the-dev-server))
- `--ssrManifest` plus `ctx.modules` (filled by `@vitejs/plugin-vue`) lets you emit preload links for the chunks used in a render. ([same – Generating Preload Directives](https://vite.dev/guide/ssr#generating-preload-directives))
- Ready-made templates: `create-vite-extra` ships `ssr-vue`, `ssr-vue-ts`, `ssr-vue-streaming` and `ssr-vue-streaming-ts`, each an Express server with `compression` + `sirv`, about 60 lines. The streaming one sends `template.split('<!--app-html-->')[0]`, the `renderToWebStream` chunks, then the tail, with status 200 already sent. ([template-ssr-vue](https://github.com/bluwy/create-vite-extra/tree/master/template-ssr-vue), [template-ssr-vue-streaming-ts](https://github.com/bluwy/create-vite-extra/tree/master/template-ssr-vue-streaming-ts))
  - Effect of streaming: the status code and headers are committed before rendering, so a render error mid-stream cannot become a 500. Serialized state must go into the tail chunk, after rendering finishes.

### Prerendering with vite-ssg (option B)
- Setup: `npm i -D vite-ssg @unhead/vue`, `"build": "vite-ssg build"`, and `export const createApp = ViteSSG(App)` from `vite-ssg/single-page` (no vue-router needed for one page). Dev stays plain `vite`. ([vite-ssg README](https://github.com/antfu-collective/vite-ssg))
- State: `initialState` is set during SSR and read on the client, serialized with `JSON.stringify` by default; `transformState` lets you plug in devalue. For Pinia, use `onSSRAppRendered(() => initialState.pinia = pinia.state.value)`. ([README – Initial State, Async Components](https://github.com/antfu-collective/vite-ssg))
- Built in: the `<ClientOnly>` component (with a `#placeholder` slot), critical-CSS inlining via `beasties`, and `@unhead/vue` for `<head>`. ([README](https://github.com/antfu-collective/vite-ssg))
- Data is frozen at build time. Refreshing it on the client is a Vue Query concern: hydrated queries with a low `staleTime` refetch in the background ("Because `staleTime` defaults to `0`, queries will be refetched in the background on page load by default"). ([TanStack Vue Query SSR](https://tanstack.com/query/latest/docs/framework/vue/guides/ssr))
- Vike's docs give the same rule of thumb: "pre-render your pages whenever you can", but not for content that changes very often. ([vike.dev/pre-rendering](https://vike.dev/pre-rendering))

### State transfer: Pinia and Vue Query
- Pinia: call `useStore()` at the top of `setup`. `onServerPrefetch(() => store.fetchData())` works without changes. Serialize `pinia.state.value` and "**you should escape the state for security reasons**" (they recommend devalue). On the client, set `pinia.state.value = …` **before any `useStore()` call**. ([Pinia SSR](https://pinia.vuejs.org/ssr/))
- Vue Query: `onServerPrefetch(suspense)` in the component, `dehydrate(queryClient)` on the server, `hydrate(queryClient, state)` on the client. Their non-Nuxt example uses `vite-ssr`'s `initialState`, but any channel works. Caveats: only successful queries are dehydrated; raise `staleTime` to avoid an immediate double fetch; on the server, use a new `QueryClient` per request (or `clear()` it). ([TanStack Vue Query SSR](https://tanstack.com/query/latest/docs/framework/vue/guides/ssr))
- With vite-ssg, either store goes into `initialState`. With a hand-rolled server, write it as `<script type="application/json" id="__state">` (escape `<`), or as a `window.__STATE__` assignment. The JSON form is not executed, so it needs no CSP nonce. (This is my inference; check it against the CSP you ship.)

### Optimized SPA (option C)
- `<link rel="preload" as="fetch" crossorigin>` can start the products request from `index.html` before the JS runs. `fetch` preloads **require `crossorigin`**, and its mode must match the eventual `fetch()` call. ([MDN rel=preload](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preload))
- `rel="preconnect"` to the API host and image host warms up DNS, TCP and TLS. ([MDN rel=preconnect](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes/rel/preconnect))
- Put `fetchpriority="high"` on the first row of images, `loading="lazy"` on the rest, and always set `width` and `height`. Lazy images "will never be loaded if they do not intersect" and default to 0×0 without dimensions. ([MDN fetchPriority](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/fetchPriority), [MDN img](https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Elements/img))
- Vite injects `modulepreload` for entry chunks by default (`build.modulePreload`). ([Vite build options](https://vite.dev/config/build-options#build-modulepreload))
- Limit: first contentful paint can be sub-second with an inline skeleton, but the product content still waits for JS to parse and the API to respond. The Vue docs note crawlers "will not wait" for content loaded asynchronously. ([Vue SSR guide – Why SSR](https://vuejs.org/guide/scaling-up/ssr#why-ssr))

### Vike (option D)
- Vike's own README: "**(Replaces Next.js/Nuxt)**". `vike-vue` is "a full-fledged Vue integration, with a high-level DX like a conventional framework such as Nuxt". ([vike README](https://github.com/vikejs/vike), [vike.dev/vike-vue](https://vike.dev/vike-vue))
- Vike also offers a low-level mode (`onRenderHtml` / `onRenderClient`, custom Vue integration). There it is closer to "an SSR tool", but it still owns routing, file conventions and the build. ([vike.dev/why](https://vike.dev/why), [vike.dev/vue](https://vike.dev/vue))
- Response headers: `+headersResponse`, documented as **beta** ("expect breaking changes in any minor version update"). ([vike.dev/headersResponse](https://vike.dev/headersResponse))
- Verdict: the kata bans Nuxt "or similar meta-frameworks", and Vike markets itself as a Nuxt replacement. An interviewer can reasonably read it as banned, so using it carries rule risk, and it also hides the rendering work the kata is meant to evaluate.

### Cart in localStorage vs. hydration (applies to A, A', B, D)
- The server cannot read localStorage, so any server-rendered cart UI (badge count, "in cart" buttons) renders as empty. If the client store loads the persisted cart **before** hydration, the client DOM differs from the server DOM and you get a mismatch warning plus a DOM patch.
- Fix: keep cart-dependent markup client-only (a `mounted` flag + `v-if`, or `<ClientOnly>` in vite-ssg), or restore the cart from storage in `onMounted` / after `app.mount()`. Either way, hydration sees the same empty cart on both sides and the badge updates one tick later. Do not hydrate Pinia's server state and then let a persistence plugin overwrite `cart` before mount. Pinia's rule "hydrate before any `useStore()`" applies to the server state only.
- Alternative: a cart cookie that the server can read. It allows a per-user SSR cart, but it makes the HTML uncacheable and is limited to ~4KB. Not worth it here.

## Recommendation

**Option A: hand-rolled, non-streaming Vite SSR**, scaffolded from `create-vite-extra`'s `ssr-vue-ts` template, with Option C's optimizations on top. Timebox it to ~90 minutes. If it is not working by then, fall back to Option B (vite-ssg single-page). That fallback reuses the same `createApp()` / `initialState` structure, so little work is lost.

Concretely:
1. Scaffold `ssr-vue-ts` (Express, or Hono if preferred). Per request, create the app, Pinia and `QueryClient`. Fetch products with Vue Query + `onServerPrefetch(suspense)`, then `dehydrate` into a JSON script tag. On the client, `hydrate` before mount and set `staleTime` to roughly the server cache TTL.
2. Add a small in-memory TTL cache of the upstream products response on the server. Without it, TTFB, and with it the "sub-second" claim, depends entirely on dummyjson/fakestore latency, which I could not measure from here.
3. In the same Express server: security headers (helmet or hand-written: CSP, `X-Content-Type-Options`, `Referrer-Policy`, etc.) and `Cache-Control`.
4. Keep the cart client-only. The Pinia cart store loads and saves localStorage after mount, and the cart badge renders behind a `mounted` flag. This is what avoids the hydration mismatch.
5. Layer on C: `preconnect` to the image host, `fetchpriority="high"` + explicit `width`/`height` on above-the-fold images, `loading="lazy"` below the fold.
6. Skip streaming. With one top-level data dependency and in-order Vue streaming, the gain is only an earlier `<head>` flush. The cost is real: state must be serialized after the stream ends, and errors can no longer become a 500 once the 200 has been sent. Mention it as a known next step in the README.

Why A over B or C:
- **C** is cheapest, but it cannot honestly claim sub-second paint of *content*, only of a skeleton. The rubric weights "rendering strategies" heavily.
- **B** gives the best raw paint and needs no server, but the product data is frozen at build time, and you still need a static server for headers. It is a strong, defensible fallback, and a good "alternatives considered" entry.
- **A** costs roughly an hour more than C and shows the full SSR story: hydration, state transfer, cross-request isolation, and the mismatch handling for the localStorage cart. It is also fully within the rules.
- **D** is ruled out by rule risk; its own README says it replaces Nuxt.

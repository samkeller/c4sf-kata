# Product API: Fake Store vs DummyJSON

Research for issue #2. Facts were checked on 2026-11-20 with live `curl` requests (marked **[live]**), plus the official docs and the APIs' own source code. Timings were measured from a US-East cloud host (Cloudflare `IAD`), so treat them as rough numbers.

## Recommendation

**Use DummyJSON.** It is the only one of the two that can support the bonus features on the server: search, category filter, sort, `limit`/`skip` pagination and field `select`. It has 194 products across 24 categories, which is enough for virtual scrolling and pagination to matter. It serves small WebP thumbnails from a CDN. Its cart writes return a computed cart and return real 4xx errors. Fake Store has 20 products in 4 categories, no search and no pagination. Its images are about 240 KB PNGs on average, it does not validate any input, and it returns `200` with an empty body for a missing product.

What this means for the build:
- **Cart:** neither API saves cart writes. DummyJSON documents its writes as "simulated". The client store (persisted to `localStorage`) is the source of truth. The optimistic update is made against the `PUT /carts/:id` / `POST /carts/add` response. That response confirms the request and lets us check totals, but it is never read back later. Rollback triggers on a network error or a 4xx/5xx.
- **Caching:** API responses carry no useful `Cache-Control`, so we need our own client cache (stale-while-revalidate keyed by query string). Both APIs return weak ETags and answer `If-None-Match` with `304`.
- **Price filter:** DummyJSON has no price-range parameter. Filter by price on the client, either over the current page or over one `limit=0&select=...` fetch, which is about 6.5 KB with brotli.

## Comparison

| | Fake Store | DummyJSON |
|---|---|---|
| Products / categories | 20 / 4 [live] | 194 / 24 [live] |
| Image | 1 `image` (PNG, avg ~240 KB, e.g. 418x597) | `thumbnail` (WebP, ~8 KB avg) + `images[]` (1-6, WebP, ~60 KB) |
| Rating | `rating: {rate, count}` | `rating: number` (+ `reviews[]`) |
| Price | `price: number` | `price` + `discountPercentage`, `stock`, `availabilityStatus` |
| Search | none | `/products/search?q=` (title + description) |
| Category filter | `/products/category/:name` | `/products/category/:slug` |
| Price filter | none | none |
| Sort | `?sort=desc` by id only | `sortBy=<field>&order=asc\|desc` |
| Pagination | `?limit=` only (no skip, no total) | `limit`, `skip`, `total` in envelope; `limit=0` = all |
| Field selection | none | `select=a,b,c` |
| Cart writes | echo request body, no validation, nothing persisted | simulated, computed totals, 404 for unknown cart/user, nothing persisted |
| CORS | `*` incl. preflight for PUT/POST/DELETE | echoes Origin + credentials, preflight OK |
| Rate limit | none advertised (no headers) | 100 req / 10 s per IP, `x-ratelimit-*` headers |
| API `Cache-Control` | none; weak ETag | `no-store`; weak ETag |
| Image `Cache-Control` | `public, max-age=14400` | `public, max-age=0, no-store` (Cloudflare edge HIT anyway) |
| TTFB, list | ~0.2 s (one outlier at 0.57 s), 10.6 KB | ~0.13-0.38 s; full list 306 KB raw / 44 KB br; trimmed `select` 6.5 KB br |
| Failure simulation | none | `?delay=0..5000`, `/http/:status/:msg` |

## Key facts

### Data shape
- Fake Store product: `{id, title, price, description, category, image, rating: {rate, count}}`. Every one of the 20 products has the same keys [live]. Its category names include spaces and apostrophes (`men's clothing`) and a typo (`jewelery`), so they must be URL-encoded.
- DummyJSON product: about 22 keys, including `thumbnail`, `images[]`, `rating` (a plain number), `stock`, `discountPercentage`, `tags`, `reviews[]` and `meta` [live] ([docs](https://dummyjson.com/docs/products)). **`brand` is missing on 92 of 194 products** [live], so it has to be optional in the type and in any brand filter. Prices range from 0.79 to 36,999.99 (the dataset includes cars), which affects the price-filter UI.
- The DummyJSON list envelope is `{products, total, skip, limit}`. A `skip` past the end returns `200` with `products: []` and `limit: 0` [live].

### Server-side query support (DummyJSON)
- Search: `/products/search?q=phone` returns 23 results. It matches on description as well as title (for example, AirPods match "phone") [live] ([docs](https://dummyjson.com/docs/products#products-search)).
- `limit`, `skip`, `select`, `sortBy` and `order` all work together on `/products`, `/products/search` and `/products/category/:slug` [live]. The docs say the parameters apply to all resources ([docs](https://dummyjson.com/docs#intro-limit)).
- Categories: `/products/categories` returns `[{slug, name, url}]` and `/products/category-list` returns `string[]` [live].
- You can filter by one category at a time and only on its own path. Search and category cannot be combined in a single request, and there is no price-range parameter. Unknown parameters such as `price_gte` and `q` on `/products` are silently ignored and return the unfiltered list [live]. So multi-criteria filtering has to happen on the client, or combine one server criterion with client-side refinement. Also available: `modifiedAfter`/`modifiedBefore` ([docs](https://dummyjson.com/docs/products)).
- Fake Store supports only `limit` and `sort=desc|asc`, and only by `id` ([source](https://github.com/keikaavousi/fake-store-api/blob/master/controller/product.js)). `skip` and `title` are ignored [live].

### Carts
- **DummyJSON** ([docs](https://dummyjson.com/docs/carts)): "Adding a new cart will not add it into the server. It will simulate a POST request". The same holds for PUT/PATCH and DELETE.
  - `POST /carts/add {userId, products:[{id, quantity}]}` returns `201` with a full computed cart (title, price, totals, thumbnails). The returned id is always `total+1` (209), and `GET /carts/209` returns 404 [live].
  - `PUT /carts/:id {merge:true, products:[...]}` returns the merged cart with recalculated totals. It handles quantity 0 without complaint [live].
  - `DELETE /carts/1` returns the cart plus `isDeleted` and `deletedOn`. Cart 1 is unchanged afterwards [live].
  - Unknown cart gives `404 {"message":"Cart with id '9999' not found"}`. Unknown user gives 404 [live].
  - Unknown product ids are **silently dropped**, giving `201` with `products: []` [live].
  - Pitfall: the docs text says items contain "`productId` & `quantity`", but the API reads `id`. Sending `productId` silently produces an empty cart [live].
  - Shape drift: write responses use `discountedPrice` (rounded to an integer) per item, while GET responses use `discountedTotal` (a float) [live].
- **Fake Store**: `POST /carts` and `PUT /carts/:id` simply echo the request body with an id, for example `{id:11, userId, products:[{id:99999, quantity:-3}]}` → 201. `PUT /carts/9999` returns 200. `DELETE /carts/1` returns the original cart, and cart 1 is unchanged afterwards [live]. The persistence code is commented out in [cart.js](https://github.com/keikaavousi/fake-store-api/blob/master/controller/cart.js). There are only 7 carts, although the homepage says 20 [live].

### Images
- DummyJSON images come from `cdn.dummyjson.com` through Cloudflare (`cf-cache-status: HIT`, `age` of about 3 days), so they are served from the edge even though the origin sends `no-store` [live]. A `thumbnail.webp` is about 10 KB. The 30 default thumbnails total 254 KB [live]. There is no resize parameter. The pre-made `thumbnail` is the only small size. Separate placeholder generator: `dummyjson.com/image/WxH` (PNG, `max-age=31536000`), useful as a fallback image [live].
- Fake Store images are at `fakestoreapi.com/img/*.png`, behind Cloudflare, with `max-age=14400`. All 20 together are **4.8 MB**, one size only, no WebP [live]. That conflicts with the sub-second initial paint target unless we add an image proxy.

### CORS, limits, caching, reliability
- Both APIs answer the CORS preflight for `PUT` with `content-type` (204) [live]. DummyJSON reflects the request Origin and sends `allow-credentials: true`. Fake Store sends `*`.
- DummyJSON limits each IP to **100 requests per 10 s** ([rate-limiter.js](https://github.com/Ovi/DummyJSON/blob/master/src/middleware/rate-limiter.js)). This applies to `cdn.dummyjson.com` images too (they carry the same `x-ratelimit-*` headers [live]). A grid that loads many images, plus prefetching, could hit 429. One more reason to cache.
- Both are free hobby services behind Cloudflare. Neither publishes an SLA or a status page (none found). A local fixture or mock fallback is worth having for the live demo.

### Ways to trigger the edge cases for real
- Network failure / slow network: DummyJSON `?delay=` (0-5000 ms; `delay=2000` measured 2.13 s [live]) and `/http/500/msg` and `/http/429` return real error statuses with a JSON body [live] ([docs](https://dummyjson.com/docs)). Combined with an `AbortController` timeout, this exercises the rollback path.
- Invalid data: `limit=-1` gives `400 {"message":"Invalid 'limit' - should be a positive number"}`. Missing product gives 404 JSON. Optional `brand`. Rating type differs between the two APIs (number vs object). The `id` vs `productId` mismatch above [live].
- Fake Store quirks: `GET /products/9999` and `/products/abc` return **`200` with an empty body**, so `res.json()` throws. Malformed JSON in a POST returns a **Cloudflare HTML** 400 page. Server errors are only `console.log`ged, so the request may hang ([source](https://github.com/keikaavousi/fake-store-api/blob/master/controller/product.js)) [live].

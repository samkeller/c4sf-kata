<!-- Remplacer par un swagger zod-openapi ou quoi. -->

# API

The Express server exposes two routes under `/api`.
Responses are JSON; errors look like `{ "error": "…" }`.

## `GET /api/products`

Returns one page of products, the number of matching products and the list of categories:

```json
{
  "products": [
    {
      "id": 1,
      "title": "…",
      "price": 9.99,
      "rating": 4.5,
      "image": "…",
      "category": { "slug": "beauty", "name": "Beauty" }
    }
  ],
  "total": 194,
  "categories": [{ "slug": "beauty", "name": "Beauty" }, "…"]
}
```

| Parameter              | Effect                                         |
| ---------------------- | ---------------------------------------------- |
| `q`                    | Search in product titles                       |
| `category`             | Keep one category, by its slug                 |
| `minPrice`, `maxPrice` | Price range, bounds included                   |
| `page`                 | Page number, 20 products per page, starts at 1 |

Invalid parameters return `400`. If DummyJSON is unreachable or returns invalid data, the route returns `502`.

## `PUT /api/cart`

Asks for the whole cart to be confirmed. Nothing is stored on the server:

```json
{
  "lines": [{ "productId": 1, "quantity": 2, "title": "…", "unitPrice": 9.99, "image": "…" }]
}
```

| Status | When                                                                       |
| ------ | -------------------------------------------------------------------------- |
| `204`  | DummyJSON confirmed the cart                                               |
| `400`  | Invalid cart: two lines for the same product, a quantity below 1, bad JSON |
| `502`  | DummyJSON is unreachable or answers with an error                          |
| `503`  | The request has the header `X-Simulate-Failure: true` (rollback demo)      |

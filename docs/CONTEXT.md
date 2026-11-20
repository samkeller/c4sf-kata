# Context

A product gallery where a visitor browses products and builds a cart. There is no checkout: the cart is never paid for.

## Language

**Product**
An item of the catalogue as the app knows it: id, title, price, rating, image and category.
It is our own type, mapped from the upstream API (DummyJSON). The API's response shape never reaches the rest of the app.
_Avoid_: item, article

**Cart**
The visitor's Cart Lines.
_Avoid_: basket, bag

- The browser holds the Cart and is its source of truth. It survives reloads and browser restarts.
- Every change shows immediately, then our server confirms the whole Cart.
- If confirmation fails, the Cart returns to the last confirmed state.

**Cart Line**
One Product in the Cart: the Product's id, a quantity, and a snapshot of its title, unit price and image taken when it was added.
_Avoid_: cart item, entry

- The snapshot lets the Cart display without fetching Products again.
- A price that has changed upstream since is acceptable, since nothing is paid.
- The Cart holds at most one Cart Line per Product.
- Line total = unit price × quantity.

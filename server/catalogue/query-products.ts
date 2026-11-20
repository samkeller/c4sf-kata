import type { Category, Product } from '#shared/product.ts'
import { PAGE_SIZE, type ProductPage, type ProductQuery } from '#shared/product-list.ts'

/**
 * Applique recherche, catégorie, prix min/max et pagination sur le catalogue en mémoire.
 *
 * Hypothèse assumée : le catalogue DummyJSON compte 194 produits, qu'on peut filtrer en
 * mémoire à chaque requête. Avec un vrai catalogue, ce travail reviendrait à un moteur de
 * recherche ou à l'API.
 *
 * La recherche porte sur le titre, sans tenir compte de la casse. Les bornes de prix sont
 * incluses. L'ordre du catalogue est conservé (pas de tri).
 */
export function queryProducts(products: readonly Product[], query: ProductQuery): ProductPage {
  const search = query.q?.toLowerCase()
  const matches = products.filter(
    (product) =>
      (search === undefined || product.title.toLowerCase().includes(search)) &&
      (query.category === undefined || product.category.slug === query.category) &&
      (query.minPrice === undefined || product.price >= query.minPrice) &&
      (query.maxPrice === undefined || product.price <= query.maxPrice),
  )
  const start = (query.page - 1) * PAGE_SIZE
  return { products: matches.slice(start, start + PAGE_SIZE), total: matches.length }
}

export function listCategories(products: readonly Product[]): Category[] {
  const bySlug = new Map(products.map((product) => [product.category.slug, product.category]))
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name))
}

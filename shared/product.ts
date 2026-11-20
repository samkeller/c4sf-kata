/**
 * DTO application représentant un produit du catalogue.
 * Indépendant de la forme de l'API amont.
 */
export interface Product {
  id: number
  title: string
  price: number
  rating: number
  image: string
  category: string
}

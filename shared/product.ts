/** `slug` pour les URL et les filtres, `name` pour l'affichage. */
export interface Category {
  slug: string
  name: string
}

/** Notre type, indépendant de la forme de l'API amont. */
export interface Product {
  id: number
  title: string
  price: number
  rating: number
  image: string
  category: Category
}

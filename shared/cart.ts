import { z } from 'zod'

const cartLineSchema = z.object({
  productId: z.number().int().positive(),
  quantity: z.number().int().positive(),
  // Instantané pris à l'ajout : le panier s'affiche sans recharger les produits.
  title: z.string().min(1),
  unitPrice: z.number().nonnegative(),
  image: z.url(),
})

/**
 * Panier complet. Partagé car il valide les deux entrées de données du panier :
 * le corps de `PUT /api/cart` côté serveur et `localStorage` côté navigateur.
 */
export const cartSchema = z.object({
  lines: z
    .array(cartLineSchema)
    .refine(
      (lines) => new Set(lines.map((line) => line.productId)).size === lines.length,
      'A product appears in more than one cart line',
    ),
})

export type CartLine = z.infer<typeof cartLineSchema>
export type Cart = z.infer<typeof cartSchema>

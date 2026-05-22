import { products as catalogProducts } from '@/data/products';
import type { Product } from '@/types';

export const CATEGORY_SLUGS: Record<string, string> = {
  laptop: '노트북',
  smartphone: '스마트폰',
  tablet: '태블릿',
  accessory: '액세서리',
};

export function serializeProduct(product: Product) {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: product.price,
    original_price: product.originalPrice ?? null,
    discount_percent: product.discount ?? null,
    is_on_sale: product.isOnSale ?? false,
    image_url: product.image,
    category: product.category,
    rating: product.rating,
    review_count: product.reviews,
  };
}

export function listProducts(options?: {
  categorySlug?: string | null;
  saleOnly?: boolean;
  limit?: number;
}) {
  let list = [...catalogProducts];

  if (options?.categorySlug) {
    const korean = CATEGORY_SLUGS[options.categorySlug];
    if (korean) {
      list = list.filter((p) => p.category === korean);
    }
  }

  if (options?.saleOnly) {
    list = list.filter((p) => p.isOnSale);
  }

  if (options?.limit && options.limit > 0) {
    list = list.slice(0, options.limit);
  }

  return list.map(serializeProduct);
}

export function getProductById(productId: string) {
  const product = catalogProducts.find((p) => p.id === productId);
  return product ? serializeProduct(product) : null;
}

export function listCategories() {
  const counts = catalogProducts.reduce<Record<string, number>>((acc, p) => {
    acc[p.category] = (acc[p.category] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(CATEGORY_SLUGS).map(([slug, name]) => ({
    slug,
    name,
    product_count: counts[name] ?? 0,
  }));
}

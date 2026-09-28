export interface IProduct {
  id: number;
  title: string;
  created_at?: string;
  price: number;
  discount: number;
  description?: string;
  category?: string;
  imageUrl: string;
  countInStock?: number;
}
export interface ICartItem {
  id: number;
  product_id: number;
  quantity: number;
  discount: number;
  imageUrl: string;
  price: number;
  title: string;
  countInStock: number;
}
export interface IFavoriteItem {
  id: number;
  product_id: number;
  quantity: number;
  discount: number;
  imageUrl: string;
  price: number;
  title: string;
  countInStock: number;
}

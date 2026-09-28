export interface IProduct {
  id: number;
  created_at: string;
  title: string;
  price: number;
  discount: number;
  description: string;
  category: string;
  imageUrl: string;
  countInStock: number;
}

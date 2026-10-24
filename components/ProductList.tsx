import type { Product } from "@/lib/types";
import ProductCard from "./ProductCard";

type Props = {
  products: Product[];
};

export default function ProductList({ products }: Props) {
  return (
    // スマホ:1列 / タブレット(768px〜):2列 / PC(1024px〜):3列
    <ul className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </ul>
  );
}

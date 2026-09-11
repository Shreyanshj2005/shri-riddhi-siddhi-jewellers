import { ShoppingBag, Check } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart, type CartProduct } from "@/context/CartContext";

type AddToCartButtonProps = {
  product: CartProduct;
  className?: string;
};

export function AddToCartButton({
  product,
  className,
}: AddToCartButtonProps) {
  const { addToCart, isInCart } = useCart();
  const [added, setAdded] = useState(false);

  const alreadyInCart = isInCart(product.id);

  const handleAdd = () => {
    addToCart(product);
    setAdded(true);

    window.setTimeout(() => {
      setAdded(false);
    }, 1500);
  };

  return (
    <Button
      type="button"
      variant="gold"
      size="lg"
      className={className}
      onClick={handleAdd}
    >
      {added || alreadyInCart ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Added to Cart
        </>
      ) : (
        <>
          <ShoppingBag className="mr-2 h-4 w-4" />
          Add to Cart
        </>
      )}
    </Button>
  );
}
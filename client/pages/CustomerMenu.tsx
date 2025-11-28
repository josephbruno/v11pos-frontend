import { useState, useEffect } from "react";
import {
  Plus,
  Minus,
  ShoppingCart,
  Clock,
  Star,
  Leaf,
  Flame,
  ChevronRight,
  X,
  MapPin,
  Users,
  Phone,
  CreditCard,
  Banknote,
  CheckCircle,
  ArrowLeft,
  Search,
  Filter,
  Heart,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import type {
  QRMenuItem,
  QRCart,
  QRCartItem,
  QRModifier,
  SelectedModifier,
} from "@/shared/api";

// Mock data for QR menu items
const mockMenuItems: QRMenuItem[] = [
  {
    id: "item-1",
    productId: "1",
    name: "Classic Burger",
    description:
      "Juicy beef patty with fresh lettuce, tomato, onion, and our special sauce on a toasted bun",
    price: 12.99,
    image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400",
    category: "Burgers",
    tags: ["popular", "bestseller"],
    available: true,
    preparationTime: 15,
    nutritionalInfo: {
      calories: 650,
      allergens: ["gluten", "dairy"],
    },
    modifiers: [
      {
        id: "cooking-1",
        name: "Cooking Level",
        type: "single",
        required: true,
        options: [
          { id: "rare", name: "Rare", price: 0, available: true },
          { id: "medium", name: "Medium", price: 0, available: true },
          { id: "well-done", name: "Well Done", price: 0, available: true },
        ],
      },
      {
        id: "extras-1",
        name: "Add Extras",
        type: "multiple",
        required: false,
        options: [
          { id: "cheese", name: "Extra Cheese", price: 1.5, available: true },
          { id: "bacon", name: "Bacon", price: 2.0, available: true },
          { id: "avocado", name: "Avocado", price: 2.5, available: true },
        ],
      },
    ],
  },
  {
    id: "item-2",
    productId: "2",
    name: "Margherita Pizza",
    description:
      "Fresh mozzarella, tomato sauce, and basil on our wood-fired crust",
    price: 14.99,
    image: "https://images.unsplash.com/photo-1604382354936-07c5d9983bd3?w=400",
    category: "Pizza",
    tags: ["vegetarian", "popular"],
    available: true,
    preparationTime: 20,
    nutritionalInfo: {
      calories: 580,
      allergens: ["gluten", "dairy"],
    },
    modifiers: [
      {
        id: "size-1",
        name: "Size",
        type: "single",
        required: true,
        options: [
          { id: "small", name: 'Small (8")', price: 0, available: true },
          { id: "medium", name: 'Medium (12")', price: 3, available: true },
          { id: "large", name: 'Large (16")', price: 6, available: true },
        ],
      },
    ],
  },
  {
    id: "item-3",
    productId: "3",
    name: "Spicy Chicken Wings",
    description: "Crispy chicken wings tossed in our signature spicy sauce",
    price: 9.99,
    image: "https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=400",
    category: "Appetizers",
    tags: ["spicy", "protein"],
    available: true,
    preparationTime: 12,
    nutritionalInfo: {
      calories: 480,
      allergens: ["dairy"],
    },
    modifiers: [
      {
        id: "spice-level",
        name: "Spice Level",
        type: "single",
        required: true,
        options: [
          { id: "mild", name: "Mild", price: 0, available: true },
          { id: "medium", name: "Medium", price: 0, available: true },
          { id: "hot", name: "Hot", price: 0, available: true },
          { id: "extra-hot", name: "Extra Hot", price: 0, available: true },
        ],
      },
    ],
  },
  {
    id: "item-4",
    productId: "4",
    name: "Caesar Salad",
    description:
      "Fresh romaine lettuce with Caesar dressing, croutons, and parmesan cheese",
    price: 8.99,
    image: "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=400",
    category: "Salads",
    tags: ["vegetarian", "healthy", "fresh"],
    available: true,
    preparationTime: 8,
    nutritionalInfo: {
      calories: 320,
      allergens: ["dairy", "gluten"],
    },
    modifiers: [
      {
        id: "protein-add",
        name: "Add Protein",
        type: "single",
        required: false,
        options: [
          { id: "chicken", name: "Grilled Chicken", price: 4, available: true },
          { id: "salmon", name: "Grilled Salmon", price: 6, available: true },
          { id: "shrimp", name: "Grilled Shrimp", price: 5, available: true },
        ],
      },
    ],
  },
  {
    id: "item-5",
    productId: "5",
    name: "Coca Cola",
    description: "Classic refreshing cola drink served ice cold",
    price: 2.99,
    image: "https://images.unsplash.com/photo-1581636625402-29b2a704ef13?w=400",
    category: "Beverages",
    tags: ["cold", "refreshing"],
    available: true,
    preparationTime: 2,
    modifiers: [
      {
        id: "size-drink",
        name: "Size",
        type: "single",
        required: true,
        options: [
          { id: "small", name: "Small", price: 0, available: true },
          { id: "medium", name: "Medium", price: 1, available: true },
          { id: "large", name: "Large", price: 2, available: true },
        ],
      },
    ],
  },
];

// Mock table information
const mockTableInfo = {
  tableNumber: "T-05",
  tableName: "Table 5",
  location: "Main Floor",
  capacity: 4,
};

interface ProductModalProps {
  item: QRMenuItem;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: QRCartItem) => void;
}

function ProductModal({
  item,
  isOpen,
  onClose,
  onAddToCart,
}: ProductModalProps) {
  const [quantity, setQuantity] = useState(1);
  const [selectedModifiers, setSelectedModifiers] = useState<
    Record<string, SelectedModifier[]>
  >({});
  const [specialInstructions, setSpecialInstructions] = useState("");

  const handleModifierChange = (
    modifierId: string,
    optionId: string,
    optionName: string,
    price: number,
  ) => {
    const modifier = item.modifiers.find((m) => m.id === modifierId);
    if (!modifier) return;

    setSelectedModifiers((prev) => {
      const current = prev[modifierId] || [];

      if (modifier.type === "single") {
        return {
          ...prev,
          [modifierId]: [
            {
              modifierId,
              optionId,
              name: optionName,
              price,
              quantity: 1,
            },
          ],
        };
      } else {
        const existing = current.find((m) => m.optionId === optionId);
        if (existing) {
          return {
            ...prev,
            [modifierId]: current.filter((m) => m.optionId !== optionId),
          };
        } else {
          return {
            ...prev,
            [modifierId]: [
              ...current,
              {
                modifierId,
                optionId,
                name: optionName,
                price,
                quantity: 1,
              },
            ],
          };
        }
      }
    });
  };

  const calculateItemTotal = () => {
    const modifierTotal = Object.values(selectedModifiers)
      .flat()
      .reduce((sum, mod) => sum + mod.price * mod.quantity, 0);
    return (item.price + modifierTotal) * quantity;
  };

  const handleAddToCart = () => {
    const cartItem: QRCartItem = {
      id: `${item.id}-${Date.now()}`,
      productId: item.productId,
      name: item.name,
      price: item.price,
      quantity,
      modifiers: Object.values(selectedModifiers).flat(),
      specialInstructions: specialInstructions || undefined,
      itemTotal: calculateItemTotal(),
    };

    onAddToCart(cartItem);
    onClose();
  };

  const canAddToCart = () => {
    return item.modifiers
      .filter((m) => m.required)
      .every((m) => selectedModifiers[m.id]?.length > 0);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-white max-w-md max-h-[90vh] overflow-y-auto p-0">
        <div className="relative">
          {/* Image */}
          <div className="relative h-64 bg-gray-200">
            <img
              src={item.image}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="absolute top-4 right-4 bg-white/90 border-gray-200"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">{item.name}</h2>
              <p className="text-gray-600 text-sm mt-1">{item.description}</p>
              <div className="flex items-center space-x-4 mt-2">
                <span className="text-lg font-bold text-primary">
                  ${item.price.toFixed(2)}
                </span>
                {item.preparationTime && (
                  <span className="text-sm text-gray-500 flex items-center">
                    <Clock className="h-3 w-3 mr-1" />
                    {item.preparationTime} min
                  </span>
                )}
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2">
              {item.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  className={`text-xs ${
                    tag === "vegetarian"
                      ? "text-green-600 border-green-200"
                      : tag === "spicy"
                        ? "text-red-600 border-red-200"
                        : tag === "popular"
                          ? "text-blue-600 border-blue-200"
                          : "text-gray-600 border-gray-200"
                  }`}
                >
                  {tag === "vegetarian" && <Leaf className="h-3 w-3 mr-1" />}
                  {tag === "spicy" && <Flame className="h-3 w-3 mr-1" />}
                  {tag === "popular" && <Star className="h-3 w-3 mr-1" />}
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Modifiers */}
            {item.modifiers.map((modifier) => (
              <div key={modifier.id} className="space-y-2">
                <Label className="font-medium text-gray-900">
                  {modifier.name}
                  {modifier.required && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </Label>
                <div className="space-y-2">
                  {modifier.options.map((option) => {
                    const isSelected = selectedModifiers[modifier.id]?.some(
                      (m) => m.optionId === option.id,
                    );
                    return (
                      <div
                        key={option.id}
                        onClick={() =>
                          handleModifierChange(
                            modifier.id,
                            option.id,
                            option.name,
                            option.price,
                          )
                        }
                        className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                          isSelected
                            ? "border-primary bg-primary/5"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-900">
                            {option.name}
                          </span>
                          <span className="text-sm text-gray-600">
                            {option.price > 0 ? `+$${option.price}` : "Free"}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* Special Instructions */}
            <div className="space-y-2">
              <Label className="font-medium text-gray-900">
                Special Instructions (Optional)
              </Label>
              <Textarea
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                placeholder="e.g., Less spicy, No onions, Extra sauce on the side..."
                className="text-sm"
                rows={3}
              />
            </div>

            {/* Quantity and Add to Cart */}
            <div className="space-y-4 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <Label className="font-medium text-gray-900">Quantity</Label>
                <div className="flex items-center space-x-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="h-8 w-8 p-0"
                  >
                    <Minus className="h-4 w-4" />
                  </Button>
                  <span className="font-medium text-gray-900 w-8 text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={!canAddToCart()}
                className="w-full bg-primary hover:bg-primary/90 text-white"
              >
                Add to Cart • ${calculateItemTotal().toFixed(2)}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function CartSummary({
  cart,
  onUpdateQuantity,
  onRemoveItem,
  onCheckout,
}: {
  cart: QRCart;
  onUpdateQuantity: (itemId: string, newQuantity: number) => void;
  onRemoveItem: (itemId: string) => void;
  onCheckout: () => void;
}) {
  if (cart.items.length === 0) {
    return (
      <div className="text-center py-8">
        <ShoppingCart className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-500">Your cart is empty</p>
        <p className="text-sm text-gray-400">
          Add items from the menu to get started
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cart.items.map((item) => (
        <div
          key={item.id}
          className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg"
        >
          <div className="flex-1">
            <h4 className="font-medium text-gray-900">{item.name}</h4>
            {item.modifiers.length > 0 && (
              <div className="text-sm text-gray-600 mt-1">
                {item.modifiers.map((mod) => mod.name).join(", ")}
              </div>
            )}
            {item.specialInstructions && (
              <div className="text-sm text-gray-500 mt-1 italic">
                "{item.specialInstructions}"
              </div>
            )}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))
                  }
                  className="h-6 w-6 p-0"
                >
                  <Minus className="h-3 w-3" />
                </Button>
                <span className="text-sm font-medium w-8 text-center">
                  {item.quantity}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                  className="h-6 w-6 p-0"
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onRemoveItem(item.id)}
                className="text-red-500 hover:text-red-600 h-6 p-1"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-right">
            <div className="font-medium text-gray-900">
              ${item.itemTotal.toFixed(2)}
            </div>
          </div>
        </div>
      ))}

      <Separator />

      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span>Subtotal:</span>
          <span>${cart.subtotal.toFixed(2)}</span>
        </div>
        {cart.serviceCharge > 0 && (
          <div className="flex justify-between text-sm">
            <span>Service Charge:</span>
            <span>${cart.serviceCharge.toFixed(2)}</span>
          </div>
        )}
        {cart.taxes.map((tax) => (
          <div key={tax.taxRuleId} className="flex justify-between text-sm">
            <span>{tax.taxName}:</span>
            <span>${tax.taxAmount.toFixed(2)}</span>
          </div>
        ))}
        <Separator />
        <div className="flex justify-between font-bold">
          <span>Total:</span>
          <span>${cart.totalAmount.toFixed(2)}</span>
        </div>
      </div>

      <Button
        onClick={onCheckout}
        className="w-full bg-primary hover:bg-primary/90 text-white"
      >
        Proceed to Checkout
      </Button>
    </div>
  );
}

export default function CustomerMenu() {
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedItem, setSelectedItem] = useState<QRMenuItem | null>(null);
  const [cart, setCart] = useState<QRCart>({
    sessionId: "session-123",
    items: [],
    subtotal: 0,
    taxes: [],
    serviceCharge: 0,
    totalAmount: 0,
    lastUpdated: new Date(),
  });
  const [showCart, setShowCart] = useState(false);

  const categories = [
    "All",
    ...Array.from(new Set(mockMenuItems.map((item) => item.category))),
  ];

  const filteredItems = mockMenuItems.filter((item) => {
    const matchesCategory =
      selectedCategory === "All" || item.category === selectedCategory;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch && item.available;
  });

  const addToCart = (cartItem: QRCartItem) => {
    setCart((prev) => {
      const newItems = [...prev.items, cartItem];
      const subtotal = newItems.reduce((sum, item) => sum + item.itemTotal, 0);
      const serviceCharge = subtotal * 0.1; // 10% service charge
      const totalAmount = subtotal + serviceCharge;

      return {
        ...prev,
        items: newItems,
        subtotal,
        serviceCharge,
        totalAmount,
        lastUpdated: new Date(),
      };
    });
  };

  const updateCartQuantity = (itemId: string, newQuantity: number) => {
    setCart((prev) => {
      const newItems = prev.items.map((item) => {
        if (item.id === itemId) {
          const basePrice =
            item.price +
            item.modifiers.reduce((sum, mod) => sum + mod.price, 0);
          return {
            ...item,
            quantity: newQuantity,
            itemTotal: basePrice * newQuantity,
          };
        }
        return item;
      });

      const subtotal = newItems.reduce((sum, item) => sum + item.itemTotal, 0);
      const serviceCharge = subtotal * 0.1;
      const totalAmount = subtotal + serviceCharge;

      return {
        ...prev,
        items: newItems,
        subtotal,
        serviceCharge,
        totalAmount,
        lastUpdated: new Date(),
      };
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => {
      const newItems = prev.items.filter((item) => item.id !== itemId);
      const subtotal = newItems.reduce((sum, item) => sum + item.itemTotal, 0);
      const serviceCharge = subtotal * 0.1;
      const totalAmount = subtotal + serviceCharge;

      return {
        ...prev,
        items: newItems,
        subtotal,
        serviceCharge,
        totalAmount,
        lastUpdated: new Date(),
      };
    });
  };

  const handleCheckout = () => {
    // Store cart in session storage for checkout
    sessionStorage.setItem("qrCart", JSON.stringify(cart));
    // Navigate to checkout page
    window.location.href = `/qr-checkout/${mockTableInfo.tableNumber.toLowerCase()}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-lg font-bold text-gray-900">RestaurantPOS</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <MapPin className="h-3 w-3" />
                <span>
                  {mockTableInfo.tableName} • {mockTableInfo.location}
                </span>
                <Users className="h-3 w-3 ml-2" />
                <span>{mockTableInfo.capacity} seats</span>
              </div>
            </div>
            <Button
              onClick={() => setShowCart(!showCart)}
              className="relative bg-primary hover:bg-primary/90 text-white"
            >
              <ShoppingCart className="h-4 w-4" />
              {cart.items.length > 0 && (
                <Badge className="absolute -top-2 -right-2 bg-red-500 text-white text-xs min-w-5 h-5 rounded-full">
                  {cart.items.reduce((sum, item) => sum + item.quantity, 0)}
                </Badge>
              )}
            </Button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search menu..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50 border-gray-200"
            />
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="sticky top-[120px] z-10 bg-white border-b border-gray-200">
        <div className="px-4 py-3">
          <div className="flex space-x-2 overflow-x-auto">
            {categories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category)}
                className={`whitespace-nowrap ${
                  selectedCategory === category
                    ? "bg-primary text-white"
                    : "text-gray-600 border-gray-200"
                }`}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex">
        {/* Menu Items */}
        <div
          className={`flex-1 p-4 space-y-4 ${showCart ? "hidden md:block" : ""}`}
        >
          {filteredItems.map((item) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden"
            >
              <div
                className="flex cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                <div className="flex-1 p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">{item.name}</h3>
                      <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                        {item.description}
                      </p>
                      <div className="flex items-center space-x-3 mt-2">
                        <span className="font-bold text-primary">
                          ${item.price.toFixed(2)}
                        </span>
                        {item.preparationTime && (
                          <span className="text-xs text-gray-500 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {item.preparationTime} min
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {item.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="outline"
                            className={`text-xs ${
                              tag === "vegetarian"
                                ? "text-green-600 border-green-200"
                                : tag === "spicy"
                                  ? "text-red-600 border-red-200"
                                  : tag === "popular"
                                    ? "text-blue-600 border-blue-200"
                                    : "text-gray-600 border-gray-200"
                            }`}
                          >
                            {tag === "vegetarian" && (
                              <Leaf className="h-2 w-2 mr-1" />
                            )}
                            {tag === "spicy" && (
                              <Flame className="h-2 w-2 mr-1" />
                            )}
                            {tag === "popular" && (
                              <Star className="h-2 w-2 mr-1" />
                            )}
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-gray-400 ml-4" />
                  </div>
                </div>
                {item.image && (
                  <div className="w-24 h-24 bg-gray-200">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                )}
              </div>
            </motion.div>
          ))}

          {filteredItems.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500">No items found</p>
              <p className="text-sm text-gray-400">
                Try adjusting your search or category
              </p>
            </div>
          )}
        </div>

        {/* Cart Sidebar */}
        <AnimatePresence>
          {showCart && (
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              className="fixed inset-y-0 right-0 w-full md:w-96 bg-white border-l border-gray-200 z-20 overflow-y-auto"
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">
                    Your Order
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowCart(false)}
                    className="md:hidden"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
                <CartSummary
                  cart={cart}
                  onUpdateQuantity={updateCartQuantity}
                  onRemoveItem={removeFromCart}
                  onCheckout={handleCheckout}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Product Modal */}
      {selectedItem && (
        <ProductModal
          item={selectedItem}
          isOpen={!!selectedItem}
          onClose={() => setSelectedItem(null)}
          onAddToCart={addToCart}
        />
      )}

      {/* Mobile Cart Button */}
      {!showCart && cart.items.length > 0 && (
        <div className="fixed bottom-4 left-4 right-4 md:hidden">
          <Button
            onClick={() => setShowCart(true)}
            className="w-full bg-primary hover:bg-primary/90 text-white shadow-lg"
          >
            <ShoppingCart className="h-4 w-4 mr-2" />
            View Cart (
            {cart.items.reduce((sum, item) => sum + item.quantity, 0)}) • $
            {cart.totalAmount.toFixed(2)}
          </Button>
        </div>
      )}
    </div>
  );
}

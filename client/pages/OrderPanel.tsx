import { useState } from "react";
import {
  Plus,
  Minus,
  Search,
  ShoppingCart,
  CreditCard,
  Printer,
  Clock,
  User,
  MapPin,
  QrCode,
  Smartphone,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  modifiers?: string[];
}

interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
  available: boolean;
}

export default function OrderPanel() {
  const [currentOrder, setCurrentOrder] = useState<OrderItem[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>("Table 5");
  const [searchQuery, setSearchQuery] = useState("");

  const categories = [
    "All",
    "Appetizers",
    "Main Course",
    "Beverages",
    "Desserts",
  ];
  const [selectedCategory, setSelectedCategory] = useState("All");

  const products: Product[] = [
    {
      id: "1",
      name: "Caesar Salad",
      price: 12.99,
      category: "Appetizers",
      available: true,
    },
    {
      id: "2",
      name: "Grilled Chicken",
      price: 18.99,
      category: "Main Course",
      available: true,
    },
    {
      id: "3",
      name: "Coca Cola",
      price: 2.99,
      category: "Beverages",
      available: true,
    },
    {
      id: "4",
      name: "Chocolate Cake",
      price: 7.99,
      category: "Desserts",
      available: true,
    },
    {
      id: "5",
      name: "Fish & Chips",
      price: 16.99,
      category: "Main Course",
      available: false,
    },
    {
      id: "6",
      name: "Garlic Bread",
      price: 6.99,
      category: "Appetizers",
      available: true,
    },
  ];

  const filteredProducts = products.filter((product) => {
    const matchesCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const addToOrder = (product: Product) => {
    const existingItem = currentOrder.find((item) => item.id === product.id);
    if (existingItem) {
      setCurrentOrder(
        currentOrder.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      );
    } else {
      setCurrentOrder([
        ...currentOrder,
        {
          id: product.id,
          name: product.name,
          price: product.price,
          quantity: 1,
        },
      ]);
    }
  };

  const updateQuantity = (id: string, change: number) => {
    setCurrentOrder(
      currentOrder
        .map((item) =>
          item.id === id ? { ...item, quantity: item.quantity + change } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const getTotalAmount = () => {
    return currentOrder.reduce(
      (total, item) => total + item.price * item.quantity,
      0,
    );
  };

  const getTotalItems = () => {
    return currentOrder.reduce((total, item) => total + item.quantity, 0);
  };

  return (
    <div className="h-[calc(100vh-1.5rem)] flex">
      {/* Left Panel - Products */}
      <div className="flex-1 pr-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-pos-text">Order Terminal</h1>
            <div className="flex items-center space-x-4 mt-2">
              <div className="flex items-center space-x-2">
                <MapPin className="h-4 w-4 text-pos-accent" />
                <span className="text-pos-text font-medium">
                  {selectedTable}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4 text-pos-text-muted" />
                <span className="text-pos-text-muted">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              className="border-pos-secondary text-pos-text-muted"
            >
              <User className="mr-2 h-4 w-4" />
              Change Table
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-background border-border text-foreground"
          />
        </div>

        {/* Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
          <TabsList className="bg-muted border-border">
            {categories.map((category) => (
              <TabsTrigger
                key={category}
                value={category}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {category}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Products Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 overflow-y-auto">
          {filteredProducts.map((product) => (
            <Card
              key={product.id}
              className={`bg-card border-border cursor-pointer transition-all hover:border-primary ${
                !product.available ? "opacity-50" : ""
              }`}
              onClick={() => product.available && addToOrder(product)}
            >
              <CardContent className="p-4">
                <div className="aspect-square bg-pos-secondary rounded-lg mb-3 flex items-center justify-center">
                  <span className="text-pos-text-muted text-xs">Image</span>
                </div>
                <h3 className="font-medium text-pos-text text-sm truncate">
                  {product.name}
                </h3>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-pos-accent font-bold">
                    ${product.price}
                  </span>
                  {!product.available && (
                    <Badge variant="destructive" className="text-xs">
                      Out of Stock
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Right Panel - Order Summary */}
      <div className="w-96 bg-card border border-border rounded-lg p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-foreground">Current Order</h2>
          <Badge className="bg-primary text-primary-foreground">
            {getTotalItems()} items
          </Badge>
        </div>

        {/* Order Items */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {currentOrder.length === 0 ? (
            <div className="text-center py-8">
              <ShoppingCart className="h-12 w-12 text-pos-text-muted mx-auto mb-3" />
              <p className="text-pos-text-muted">No items in order</p>
              <p className="text-sm text-pos-text-muted">
                Add items from the menu to get started
              </p>
            </div>
          ) : (
            currentOrder.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border"
              >
                <div className="flex-1">
                  <h4 className="font-medium text-pos-text text-sm">
                    {item.name}
                  </h4>
                  <p className="text-pos-accent text-sm font-medium">
                    ${item.price} each
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-pos-secondary"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <Minus className="h-3 w-3" />
                  </Button>
                  <span className="w-8 text-center text-pos-text font-medium">
                    {item.quantity}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 w-8 p-0 border-pos-secondary"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Order Summary */}
        {currentOrder.length > 0 && (
          <>
            <div className="border-t border-pos-secondary pt-4 space-y-2">
              <div className="flex justify-between text-pos-text-muted">
                <span>Subtotal</span>
                <span>${getTotalAmount().toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-pos-text-muted">
                <span>Tax (8%)</span>
                <span>${(getTotalAmount() * 0.08).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold text-pos-text border-t border-pos-secondary pt-2">
                <span>Total</span>
                <span>${(getTotalAmount() * 1.08).toFixed(2)}</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2">
              <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <CreditCard className="mr-2 h-4 w-4" />
                Process Payment
              </Button>
              <div className="grid grid-cols-2 gap-2">
                <Button
                  variant="outline"
                  className="border-pos-secondary text-pos-text-muted"
                >
                  <Clock className="mr-2 h-4 w-4" />
                  Hold Order
                </Button>
                <Button
                  variant="outline"
                  className="border-pos-secondary text-pos-text-muted"
                >
                  <Printer className="mr-2 h-4 w-4" />
                  Print KOT
                </Button>
              </div>
              <Button
                variant="outline"
                className="w-full border-pos-secondary text-pos-text-muted"
                onClick={() => setCurrentOrder([])}
              >
                Clear Order
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

import { useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Package,
  Save,
  X,
  ChefHat,
  Minus,
  RotateCcw,
  Percent,
  DollarSign,
  ShoppingCart,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import type {
  Product,
  ComboProduct,
  ComboItem,
  ComboModifier,
} from "@/shared/api";

// Mock data for products
const mockProducts: Product[] = [
  {
    id: "1",
    name: "Classic Burger",
    description: "Beef patty with lettuce, tomato, and our special sauce",
    price: 12.99,
    category: "main-course",
    stock: 25,
    minStock: 5,
    available: true,
    featured: true,
    cost: 5.5,
    margin: 57,
    tags: ["burger", "beef"],
    modifiers: ["cooking-level", "sauce-choice"],
    department: "kitchen",
    printerTag: "grill",
  },
  {
    id: "2",
    name: "French Fries",
    description: "Crispy golden fries seasoned with salt",
    price: 4.99,
    category: "sides",
    stock: 50,
    minStock: 10,
    available: true,
    featured: false,
    cost: 1.2,
    margin: 76,
    tags: ["fries", "potato", "crispy"],
    modifiers: ["size", "seasoning"],
    department: "kitchen",
    printerTag: "fryer",
  },
  {
    id: "3",
    name: "Coca Cola",
    description: "Classic refreshing cola drink",
    price: 2.99,
    category: "beverages",
    stock: 100,
    minStock: 20,
    available: true,
    featured: false,
    cost: 0.8,
    margin: 73,
    tags: ["beverage", "cold", "cola"],
    modifiers: ["size", "ice"],
    department: "bar",
    printerTag: "beverage_station",
  },
  {
    id: "4",
    name: "Chicken Wings",
    description: "Spicy buffalo chicken wings with ranch dip",
    price: 9.99,
    category: "appetizers",
    stock: 15,
    minStock: 3,
    available: true,
    featured: true,
    cost: 4.2,
    margin: 58,
    tags: ["chicken", "spicy", "wings"],
    modifiers: ["spice-level", "sauce-choice"],
    department: "kitchen",
    printerTag: "grill",
  },
  {
    id: "5",
    name: "Ice Cream Sundae",
    description: "Vanilla ice cream with chocolate sauce and cherry",
    price: 6.99,
    category: "desserts",
    stock: 20,
    minStock: 5,
    available: true,
    featured: false,
    cost: 2.1,
    margin: 70,
    tags: ["dessert", "cold", "sweet"],
    modifiers: ["flavor", "toppings"],
    department: "dessert",
    printerTag: "dessert_station",
  },
];

// Mock combos
const mockCombos: ComboProduct[] = [
  {
    id: "combo-1",
    name: "Classic Burger Combo",
    description: "Classic Burger + Fries + Drink",
    basePrice: 18.97,
    discountType: "fixed",
    discountValue: 2.0,
    items: [
      {
        productId: "1",
        quantity: 1,
        required: true,
        substituteOptions: [],
      },
      {
        productId: "2",
        quantity: 1,
        required: true,
        substituteOptions: [],
      },
      {
        productId: "3",
        quantity: 1,
        required: true,
        substituteOptions: [],
      },
    ],
    available: true,
    category: "combos",
    tags: ["burger", "combo", "meal"],
  },
];

interface ComboBuilderProps {
  combo?: ComboProduct;
  onSave: (combo: Partial<ComboProduct>) => void;
  onCancel: () => void;
}

function ComboBuilder({ combo, onSave, onCancel }: ComboBuilderProps) {
  const [formData, setFormData] = useState({
    name: combo?.name || "",
    description: combo?.description || "",
    discountType: combo?.discountType || "fixed",
    discountValue: combo?.discountValue || 0,
    category: combo?.category || "combos",
    available: combo?.available ?? true,
    items: combo?.items || [],
  });

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");

  const filteredProducts = mockProducts.filter((product) => {
    const matchesSearch = product.name
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory && product.available;
  });

  const addItemToCombo = (product: Product) => {
    const existingItem = formData.items.find(
      (item) => item.productId === product.id,
    );

    if (existingItem) {
      setFormData({
        ...formData,
        items: formData.items.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item,
        ),
      });
    } else {
      setFormData({
        ...formData,
        items: [
          ...formData.items,
          {
            productId: product.id,
            quantity: 1,
            required: true,
            substituteOptions: [],
          },
        ],
      });
    }
  };

  const removeItemFromCombo = (productId: string) => {
    setFormData({
      ...formData,
      items: formData.items.filter((item) => item.productId !== productId),
    });
  };

  const updateItemQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItemFromCombo(productId);
      return;
    }

    setFormData({
      ...formData,
      items: formData.items.map((item) =>
        item.productId === productId ? { ...item, quantity } : item,
      ),
    });
  };

  const toggleItemRequired = (productId: string) => {
    setFormData({
      ...formData,
      items: formData.items.map((item) =>
        item.productId === productId
          ? { ...item, required: !item.required }
          : item,
      ),
    });
  };

  const calculateTotalPrice = () => {
    const itemsTotal = formData.items.reduce((sum, item) => {
      const product = mockProducts.find((p) => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    return itemsTotal;
  };

  const calculateComboPrice = () => {
    const total = calculateTotalPrice();
    if (formData.discountType === "fixed") {
      return Math.max(0, total - formData.discountValue);
    } else {
      return total * (1 - formData.discountValue / 100);
    }
  };

  const calculateSavings = () => {
    return calculateTotalPrice() - calculateComboPrice();
  };

  const handleSubmit = () => {
    const comboData = {
      ...formData,
      basePrice: calculateTotalPrice(),
    };
    onSave(comboData);
  };

  const categories = Array.from(
    new Set(mockProducts.map((p) => p.category)),
  ).map((cat) => ({
    id: cat,
    name: cat.charAt(0).toUpperCase() + cat.slice(1).replace("-", " "),
  }));

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      {/* Combo Details */}
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="combo-name" className="text-foreground">
              Combo Name
            </Label>
            <Input
              id="combo-name"
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="bg-background border-border text-foreground"
              placeholder="Enter combo name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="combo-category" className="text-foreground">
              Category
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData({ ...formData, category: value })
              }
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="combos">Combos</SelectItem>
                <SelectItem value="meal-deals">Meal Deals</SelectItem>
                <SelectItem value="family-packs">Family Packs</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="combo-description" className="text-foreground">
            Description
          </Label>
          <Textarea
            id="combo-description"
            value={formData.description}
            onChange={(e) =>
              setFormData({ ...formData, description: e.target.value })
            }
            className="bg-background border-border text-foreground"
            placeholder="Describe the combo"
            rows={2}
          />
        </div>

        {/* Discount Configuration */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label className="text-foreground">Discount Type</Label>
            <Select
              value={formData.discountType}
              onValueChange={(value: "fixed" | "percentage") =>
                setFormData({ ...formData, discountType: value })
              }
            >
              <SelectTrigger className="bg-background border-border text-foreground">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="fixed">Fixed Amount</SelectItem>
                <SelectItem value="percentage">Percentage</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label className="text-foreground">
              Discount Value ({formData.discountType === "fixed" ? "$" : "%"})
            </Label>
            <Input
              type="number"
              step={formData.discountType === "fixed" ? "0.01" : "1"}
              value={formData.discountValue}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  discountValue: parseFloat(e.target.value) || 0,
                })
              }
              className="bg-background border-border text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label className="text-pos-text">Available</Label>
            <div className="flex items-center h-10">
              <Switch
                checked={formData.available}
                onCheckedChange={(checked) =>
                  setFormData({ ...formData, available: checked })
                }
              />
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Combo Items Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-pos-text">Combo Items</h3>
          <div className="text-sm text-pos-text-muted">
            {formData.items.length} items selected
          </div>
        </div>

        {/* Selected Items */}
        {formData.items.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-pos-text">
              Selected Items:
            </h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {formData.items.map((item) => {
                const product = mockProducts.find(
                  (p) => p.id === item.productId,
                );
                if (!product) return null;

                return (
                  <div
                    key={item.productId}
                    className="flex items-center justify-between p-3 bg-pos-secondary rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <div>
                        <div className="text-pos-text font-medium">
                          {product.name}
                        </div>
                        <div className="text-pos-text-muted text-sm">
                          ${product.price} each
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleItemRequired(item.productId)}
                        className={`border-pos-secondary text-xs ${
                          item.required
                            ? "bg-pos-accent text-pos-text"
                            : "text-pos-text-muted"
                        }`}
                      >
                        {item.required ? "Required" : "Optional"}
                      </Button>
                      <div className="flex items-center space-x-1">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateItemQuantity(
                              item.productId,
                              item.quantity - 1,
                            )
                          }
                          className="h-8 w-8 p-0 border-pos-secondary text-pos-text-muted"
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="text-pos-text w-8 text-center">
                          {item.quantity}
                        </span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            updateItemQuantity(
                              item.productId,
                              item.quantity + 1,
                            )
                          }
                          className="h-8 w-8 p-0 border-pos-secondary text-pos-text-muted"
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => removeItemFromCombo(item.productId)}
                        className="h-8 w-8 p-0 border-pos-secondary text-pos-error"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Product Search and Selection */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-pos-text">Add Products:</h4>
          <div className="flex space-x-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pos-text-muted h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-pos-surface border-pos-secondary text-pos-text"
              />
            </div>
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger className="w-48 bg-pos-surface border-pos-secondary text-pos-text">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent className="bg-pos-surface border-pos-secondary">
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Available Products */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="p-3 bg-pos-surface border border-pos-secondary rounded-lg"
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="text-pos-text font-medium">
                    {product.name}
                  </div>
                  <div className="text-pos-text-muted text-sm">
                    ${product.price}
                  </div>
                  <div className="flex flex-wrap gap-1 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {product.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {product.department}
                    </Badge>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => addItemToCombo(product)}
                  className="border-pos-secondary text-pos-accent hover:bg-pos-accent hover:text-pos-text"
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Separator />

      {/* Pricing Summary */}
      <div className="space-y-3">
        <h3 className="text-lg font-semibold text-pos-text">Pricing Summary</h3>
        <div className="bg-pos-secondary rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-pos-text">
            <span>Individual Items Total:</span>
            <span>${calculateTotalPrice().toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-pos-text">
            <span>
              Discount ({formData.discountType === "fixed" ? "$" : "%"}
              {formData.discountValue}):
            </span>
            <span className="text-pos-accent">
              -${calculateSavings().toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold text-pos-text border-t border-pos-primary pt-2">
            <span>Combo Price:</span>
            <span>${calculateComboPrice().toFixed(2)}</span>
          </div>
          {calculateSavings() > 0 && (
            <div className="text-center text-pos-accent text-sm">
              Customer saves ${calculateSavings().toFixed(2)}!
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-2 pt-4 border-t border-pos-secondary">
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-pos-secondary text-pos-text-muted hover:text-pos-text"
        >
          <X className="mr-2 h-4 w-4" />
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={formData.items.length === 0 || !formData.name}
          className="bg-pos-accent hover:bg-pos-accent/90"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Combo
        </Button>
      </div>
    </div>
  );
}

export default function ComboManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingCombo, setIsAddingCombo] = useState(false);
  const [editingCombo, setEditingCombo] = useState<ComboProduct | null>(null);
  const [combos, setCombos] = useState<ComboProduct[]>(mockCombos);

  const filteredCombos = combos.filter((combo) =>
    combo.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSaveCombo = (comboData: Partial<ComboProduct>) => {
    const newCombo: ComboProduct = {
      id: editingCombo?.id || `combo-${Date.now()}`,
      name: comboData.name!,
      description: comboData.description!,
      basePrice: comboData.basePrice!,
      discountType: comboData.discountType!,
      discountValue: comboData.discountValue!,
      items: comboData.items!,
      available: comboData.available!,
      category: comboData.category!,
      tags: comboData.tags || [],
    };

    if (editingCombo) {
      setCombos(combos.map((c) => (c.id === editingCombo.id ? newCombo : c)));
      setEditingCombo(null);
    } else {
      setCombos([...combos, newCombo]);
      setIsAddingCombo(false);
    }
  };

  const deleteCombo = (comboId: string) => {
    setCombos(combos.filter((c) => c.id !== comboId));
  };

  const getComboPrice = (combo: ComboProduct) => {
    const itemsTotal = combo.items.reduce((sum, item) => {
      const product = mockProducts.find((p) => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);

    if (combo.discountType === "fixed") {
      return Math.max(0, itemsTotal - combo.discountValue);
    } else {
      return itemsTotal * (1 - combo.discountValue / 100);
    }
  };

  const getSavings = (combo: ComboProduct) => {
    const itemsTotal = combo.items.reduce((sum, item) => {
      const product = mockProducts.find((p) => p.id === item.productId);
      return sum + (product ? product.price * item.quantity : 0);
    }, 0);
    return itemsTotal - getComboPrice(combo);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Combo Management
          </h1>
          <p className="text-muted-foreground mt-1">
            Create and manage combo products to increase average order value
          </p>
        </div>
        <Dialog open={isAddingCombo} onOpenChange={setIsAddingCombo}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <ChefHat className="mr-2 h-4 w-4" />
              Create Combo
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-card-foreground">
                Create New Combo
              </DialogTitle>
            </DialogHeader>
            <ComboBuilder
              onSave={handleSaveCombo}
              onCancel={() => setIsAddingCombo(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Card className="bg-card border-border">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search combos..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-background border-border text-foreground"
            />
          </div>
        </CardContent>
      </Card>

      {/* Combos Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCombos.map((combo) => (
          <Card key={combo.id} className="bg-card border-border">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg text-card-foreground">
                    {combo.name}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {combo.description}
                  </p>
                </div>
                <Badge
                  className={`ml-2 ${
                    combo.available
                      ? "bg-green-500 text-white"
                      : "bg-red-500 text-white"
                  }`}
                >
                  {combo.available ? "Available" : "Unavailable"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Combo Items */}
              <div className="space-y-2">
                <h4 className="text-sm font-medium text-foreground">
                  Includes:
                </h4>
                <div className="space-y-1">
                  {combo.items.map((item) => {
                    const product = mockProducts.find(
                      (p) => p.id === item.productId,
                    );
                    if (!product) return null;

                    return (
                      <div
                        key={item.productId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span className="text-muted-foreground">
                          {item.quantity}x {product.name}
                        </span>
                        <span className="text-foreground">
                          ${(product.price * item.quantity).toFixed(2)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pricing */}
              <div className="space-y-2 pt-2 border-t border-border">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Individual Total:
                  </span>
                  <span className="text-foreground line-through">
                    ${combo.basePrice.toFixed(2)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-foreground font-medium">
                    Combo Price:
                  </span>
                  <span className="text-foreground font-bold text-lg">
                    ${getComboPrice(combo).toFixed(2)}
                  </span>
                </div>
                {getSavings(combo) > 0 && (
                  <div className="text-center">
                    <Badge className="bg-green-500 text-white">
                      Save ${getSavings(combo).toFixed(2)}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Discount Info */}
              <div className="flex items-center justify-center space-x-2 text-sm text-muted-foreground">
                {combo.discountType === "fixed" ? (
                  <DollarSign className="h-4 w-4" />
                ) : (
                  <Percent className="h-4 w-4" />
                )}
                <span>
                  {combo.discountType === "fixed"
                    ? `$${combo.discountValue} off`
                    : `${combo.discountValue}% off`}
                </span>
              </div>

              {/* Actions */}
              <div className="flex items-center space-x-2 pt-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 border-pos-secondary text-pos-text-muted hover:text-pos-text"
                      onClick={() => setEditingCombo(combo)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-pos-surface border-pos-secondary max-w-4xl max-h-[90vh]">
                    <DialogHeader>
                      <DialogTitle className="text-pos-text">
                        Edit Combo
                      </DialogTitle>
                    </DialogHeader>
                    <ComboBuilder
                      combo={editingCombo || undefined}
                      onSave={handleSaveCombo}
                      onCancel={() => setEditingCombo(null)}
                    />
                  </DialogContent>
                </Dialog>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => deleteCombo(combo.id)}
                  className="border-pos-secondary text-pos-error hover:text-pos-error"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCombos.length === 0 && (
        <Card className="bg-pos-surface border-pos-secondary">
          <CardContent className="text-center py-12">
            <Package className="mx-auto h-12 w-12 text-pos-text-muted mb-4" />
            <h3 className="text-lg font-semibold text-pos-text mb-2">
              No combos found
            </h3>
            <p className="text-pos-text-muted mb-4">
              {searchQuery
                ? "Try adjusting your search query"
                : "Create your first combo to increase average order value"}
            </p>
            {!searchQuery && (
              <Button
                onClick={() => setIsAddingCombo(true)}
                className="bg-pos-accent hover:bg-pos-accent/90"
              >
                <ChefHat className="mr-2 h-4 w-4" />
                Create First Combo
              </Button>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

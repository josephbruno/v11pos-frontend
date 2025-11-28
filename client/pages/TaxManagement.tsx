import { useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Calculator,
  Save,
  X,
  Percent,
  DollarSign,
  Settings as SettingsIcon,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
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
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import type { TaxRule, TaxCalculation } from "@/shared/api";

const mockCategories = [
  "appetizers",
  "main-course",
  "beverages",
  "desserts",
  "alcohol",
];

const mockTaxRules: TaxRule[] = [
  {
    id: "cgst-5",
    name: "CGST 5%",
    type: "CGST",
    percentage: 5,
    applicableOn: "all",
    categories: undefined,
    minAmount: undefined,
    maxAmount: undefined,
    isCompounded: false,
    active: true,
  },
  {
    id: "sgst-5",
    name: "SGST 5%",
    type: "SGST",
    percentage: 5,
    applicableOn: "all",
    categories: undefined,
    minAmount: undefined,
    maxAmount: undefined,
    isCompounded: false,
    active: true,
  },
  {
    id: "service-tax",
    name: "Service Tax",
    type: "SERVICE_TAX",
    percentage: 10,
    applicableOn: "dine_in",
    categories: undefined,
    minAmount: 100,
    maxAmount: undefined,
    isCompounded: true,
    active: true,
  },
  {
    id: "alcohol-vat",
    name: "Alcohol VAT",
    type: "VAT",
    percentage: 25,
    applicableOn: "all",
    categories: ["alcohol"],
    minAmount: undefined,
    maxAmount: undefined,
    isCompounded: false,
    active: true,
  },
];

interface TaxRuleFormProps {
  taxRule?: TaxRule;
  onSave: (rule: Partial<TaxRule>) => void;
  onCancel: () => void;
}

function TaxRuleForm({ taxRule, onSave, onCancel }: TaxRuleFormProps) {
  const [formData, setFormData] = useState({
    name: taxRule?.name || "",
    type: taxRule?.type || "CGST",
    percentage: taxRule?.percentage || 0,
    applicableOn: taxRule?.applicableOn || "all",
    categories: taxRule?.categories || [],
    minAmount: taxRule?.minAmount || undefined,
    maxAmount: taxRule?.maxAmount || undefined,
    isCompounded: taxRule?.isCompounded || false,
    active: taxRule?.active ?? true,
  });

  const handleCategoryToggle = (category: string) => {
    const updatedCategories = formData.categories.includes(category)
      ? formData.categories.filter((c) => c !== category)
      : [...formData.categories, category];

    setFormData({ ...formData, categories: updatedCategories });
  };

  const handleSubmit = () => {
    onSave({
      ...formData,
      categories:
        formData.categories.length > 0 ? formData.categories : undefined,
    });
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tax-name" className="text-pos-text">
            Tax Rule Name
          </Label>
          <Input
            id="tax-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-pos-surface border-pos-secondary text-pos-text"
            placeholder="e.g., CGST 5%"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="tax-type" className="text-pos-text">
            Tax Type
          </Label>
          <Select
            value={formData.type}
            onValueChange={(value: TaxRule["type"]) =>
              setFormData({ ...formData, type: value })
            }
          >
            <SelectTrigger className="bg-pos-surface border-pos-secondary text-pos-text">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-pos-surface border-pos-secondary">
              <SelectItem value="CGST">CGST</SelectItem>
              <SelectItem value="SGST">SGST</SelectItem>
              <SelectItem value="VAT">VAT</SelectItem>
              <SelectItem value="SERVICE_TAX">Service Tax</SelectItem>
              <SelectItem value="CUSTOM">Custom Tax</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="tax-percentage" className="text-pos-text">
            Tax Percentage (%)
          </Label>
          <Input
            id="tax-percentage"
            type="number"
            step="0.01"
            min="0"
            max="100"
            value={formData.percentage}
            onChange={(e) =>
              setFormData({
                ...formData,
                percentage: parseFloat(e.target.value) || 0,
              })
            }
            className="bg-pos-surface border-pos-secondary text-pos-text"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="applicable-on" className="text-pos-text">
            Applicable On
          </Label>
          <Select
            value={formData.applicableOn}
            onValueChange={(value: TaxRule["applicableOn"]) =>
              setFormData({ ...formData, applicableOn: value })
            }
          >
            <SelectTrigger className="bg-pos-surface border-pos-secondary text-pos-text">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-pos-surface border-pos-secondary">
              <SelectItem value="all">All Order Types</SelectItem>
              <SelectItem value="dine_in">Dine In Only</SelectItem>
              <SelectItem value="takeaway">Takeaway Only</SelectItem>
              <SelectItem value="delivery">Delivery Only</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="min-amount" className="text-pos-text">
            Minimum Amount ($)
            <span className="text-pos-text-muted text-sm ml-1">(Optional)</span>
          </Label>
          <Input
            id="min-amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.minAmount || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                minAmount: e.target.value
                  ? parseFloat(e.target.value)
                  : undefined,
              })
            }
            className="bg-pos-surface border-pos-secondary text-pos-text"
            placeholder="Leave empty for no minimum"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="max-amount" className="text-pos-text">
            Maximum Taxable Amount ($)
            <span className="text-pos-text-muted text-sm ml-1">(Optional)</span>
          </Label>
          <Input
            id="max-amount"
            type="number"
            step="0.01"
            min="0"
            value={formData.maxAmount || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                maxAmount: e.target.value
                  ? parseFloat(e.target.value)
                  : undefined,
              })
            }
            className="bg-pos-surface border-pos-secondary text-pos-text"
            placeholder="Leave empty for no maximum"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label className="text-pos-text">Applicable Categories</Label>
        <p className="text-sm text-pos-text-muted">
          Leave empty to apply to all categories
        </p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {mockCategories.map((category) => (
            <div
              key={category}
              className="flex items-center space-x-2 p-3 bg-pos-secondary rounded-lg"
            >
              <Switch
                checked={formData.categories.includes(category)}
                onCheckedChange={() => handleCategoryToggle(category)}
              />
              <Label className="text-pos-text capitalize">
                {category.replace("-", " ")}
              </Label>
            </div>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-pos-secondary rounded-lg">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.isCompounded}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isCompounded: checked })
              }
            />
            <Label className="text-pos-text font-medium">Compound Tax</Label>
          </div>
          <p className="text-sm text-pos-text-muted">
            Applied on top of other taxes
          </p>
        </div>
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <Switch
              checked={formData.active}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, active: checked })
              }
            />
            <Label className="text-pos-text font-medium">Active</Label>
          </div>
          <p className="text-sm text-pos-text-muted">Enable this tax rule</p>
        </div>
      </div>

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
          disabled={!formData.name || formData.percentage <= 0}
          className="bg-pos-accent hover:bg-pos-accent/90"
        >
          <Save className="mr-2 h-4 w-4" />
          Save Tax Rule
        </Button>
      </div>
    </div>
  );
}

function TaxCalculator() {
  const [orderAmount, setOrderAmount] = useState(100);
  const [orderType, setOrderType] = useState<
    "dine_in" | "takeaway" | "delivery"
  >("dine_in");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([
    "main-course",
  ]);

  const calculateTaxes = (): TaxCalculation[] => {
    const applicableRules = mockTaxRules.filter((rule) => {
      if (!rule.active) return false;

      // Check order type
      if (rule.applicableOn !== "all" && rule.applicableOn !== orderType) {
        return false;
      }

      // Check minimum amount
      if (rule.minAmount && orderAmount < rule.minAmount) {
        return false;
      }

      // Check categories
      if (rule.categories && rule.categories.length > 0) {
        const hasMatchingCategory = rule.categories.some((cat) =>
          selectedCategories.includes(cat),
        );
        if (!hasMatchingCategory) return false;
      }

      return true;
    });

    let baseAmount = orderAmount;
    const calculations: TaxCalculation[] = [];

    // First calculate non-compound taxes
    const nonCompoundRules = applicableRules.filter(
      (rule) => !rule.isCompounded,
    );
    nonCompoundRules.forEach((rule) => {
      const taxableAmount = rule.maxAmount
        ? Math.min(baseAmount, rule.maxAmount)
        : baseAmount;
      const taxAmount = (taxableAmount * rule.percentage) / 100;

      calculations.push({
        taxRuleId: rule.id,
        taxName: rule.name,
        taxableAmount,
        taxAmount,
        taxPercentage: rule.percentage,
      });
    });

    // Then calculate compound taxes on top of base + non-compound taxes
    const compoundRules = applicableRules.filter((rule) => rule.isCompounded);
    const totalNonCompoundTax = calculations.reduce(
      (sum, calc) => sum + calc.taxAmount,
      0,
    );
    const compoundBase = baseAmount + totalNonCompoundTax;

    compoundRules.forEach((rule) => {
      const taxableAmount = rule.maxAmount
        ? Math.min(compoundBase, rule.maxAmount)
        : compoundBase;
      const taxAmount = (taxableAmount * rule.percentage) / 100;

      calculations.push({
        taxRuleId: rule.id,
        taxName: rule.name,
        taxableAmount,
        taxAmount,
        taxPercentage: rule.percentage,
      });
    });

    return calculations;
  };

  const taxCalculations = calculateTaxes();
  const totalTax = taxCalculations.reduce(
    (sum, calc) => sum + calc.taxAmount,
    0,
  );
  const finalAmount = orderAmount + totalTax;

  return (
    <div className="space-y-6">
      <Card className="bg-pos-surface border-pos-secondary">
        <CardHeader>
          <CardTitle className="text-pos-text flex items-center">
            <Calculator className="mr-2 h-5 w-5" />
            Tax Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label className="text-pos-text">Order Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={orderAmount}
                onChange={(e) =>
                  setOrderAmount(parseFloat(e.target.value) || 0)
                }
                className="bg-pos-surface border-pos-secondary text-pos-text"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-pos-text">Order Type</Label>
              <Select
                value={orderType}
                onValueChange={(value: typeof orderType) => setOrderType(value)}
              >
                <SelectTrigger className="bg-pos-surface border-pos-secondary text-pos-text">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-pos-surface border-pos-secondary">
                  <SelectItem value="dine_in">Dine In</SelectItem>
                  <SelectItem value="takeaway">Takeaway</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="text-pos-text">Categories</Label>
              <Select
                value={selectedCategories[0] || ""}
                onValueChange={(value) => setSelectedCategories([value])}
              >
                <SelectTrigger className="bg-pos-surface border-pos-secondary text-pos-text">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-pos-surface border-pos-secondary">
                  {mockCategories.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category.replace("-", " ").toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-pos-surface border-pos-secondary">
        <CardHeader>
          <CardTitle className="text-pos-text">Tax Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between text-pos-text">
              <span>Order Amount:</span>
              <span>${orderAmount.toFixed(2)}</span>
            </div>

            {taxCalculations.length === 0 ? (
              <div className="text-center py-4 text-pos-text-muted">
                No applicable taxes for current configuration
              </div>
            ) : (
              taxCalculations.map((calc) => (
                <div
                  key={calc.taxRuleId}
                  className="flex justify-between text-pos-text text-sm"
                >
                  <span>
                    {calc.taxName} ({calc.taxPercentage}%):
                  </span>
                  <span>${calc.taxAmount.toFixed(2)}</span>
                </div>
              ))
            )}

            <Separator />
            <div className="flex justify-between text-pos-text font-bold text-lg">
              <span>Total Tax:</span>
              <span>${totalTax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-pos-accent font-bold text-xl">
              <span>Final Amount:</span>
              <span>${finalAmount.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function TaxManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isAddingRule, setIsAddingRule] = useState(false);
  const [editingRule, setEditingRule] = useState<TaxRule | null>(null);
  const [taxRules, setTaxRules] = useState<TaxRule[]>(mockTaxRules);

  const filteredRules = taxRules.filter(
    (rule) =>
      rule.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rule.type.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleSaveRule = (ruleData: Partial<TaxRule>) => {
    const newRule: TaxRule = {
      id: editingRule?.id || `tax-${Date.now()}`,
      name: ruleData.name!,
      type: ruleData.type!,
      percentage: ruleData.percentage!,
      applicableOn: ruleData.applicableOn!,
      categories: ruleData.categories,
      minAmount: ruleData.minAmount,
      maxAmount: ruleData.maxAmount,
      isCompounded: ruleData.isCompounded!,
      active: ruleData.active!,
    };

    if (editingRule) {
      setTaxRules(taxRules.map((r) => (r.id === editingRule.id ? newRule : r)));
      setEditingRule(null);
    } else {
      setTaxRules([...taxRules, newRule]);
      setIsAddingRule(false);
    }
  };

  const deleteRule = (ruleId: string) => {
    setTaxRules(taxRules.filter((r) => r.id !== ruleId));
  };

  const toggleRuleActive = (ruleId: string) => {
    setTaxRules(
      taxRules.map((rule) =>
        rule.id === ruleId ? { ...rule, active: !rule.active } : rule,
      ),
    );
  };

  const getApplicabilityText = (rule: TaxRule) => {
    const parts = [];

    if (rule.applicableOn !== "all") {
      parts.push(rule.applicableOn.replace("_", " ").toUpperCase());
    }

    if (rule.categories && rule.categories.length > 0) {
      parts.push(rule.categories.join(", ").toUpperCase());
    }

    if (rule.minAmount) {
      parts.push(`Min: $${rule.minAmount}`);
    }

    if (rule.maxAmount) {
      parts.push(`Max: $${rule.maxAmount}`);
    }

    return parts.length > 0 ? parts.join(" • ") : "All Orders";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Tax Management</h1>
          <p className="text-muted-foreground mt-1">
            Configure CGST, SGST, VAT, service tax, and custom tax rules
          </p>
        </div>
        <Dialog open={isAddingRule} onOpenChange={setIsAddingRule}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Add Tax Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-3xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="text-card-foreground">
                Create Tax Rule
              </DialogTitle>
            </DialogHeader>
            <TaxRuleForm
              onSave={handleSaveRule}
              onCancel={() => setIsAddingRule(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="rules">
        <TabsList className="bg-muted border-border">
          <TabsTrigger
            value="rules"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <SettingsIcon className="mr-2 h-4 w-4" />
            Tax Rules
          </TabsTrigger>
          <TabsTrigger
            value="calculator"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <Calculator className="mr-2 h-4 w-4" />
            Tax Calculator
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                <Input
                  placeholder="Search tax rules..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-background border-border text-foreground"
                />
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredRules.map((rule) => (
              <Card
                key={rule.id}
                className="bg-pos-surface border-pos-secondary"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-pos-text flex items-center">
                        {rule.name}
                        {rule.isCompounded && (
                          <Badge className="ml-2 bg-pos-warning text-pos-text">
                            Compound
                          </Badge>
                        )}
                      </CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge variant="outline">{rule.type}</Badge>
                        <Badge
                          className={
                            rule.active
                              ? "bg-pos-success text-pos-text"
                              : "bg-pos-error text-pos-text"
                          }
                        >
                          {rule.active ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-pos-accent">
                        {rule.percentage}%
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <div className="text-sm text-pos-text-muted">
                      Applicability:
                    </div>
                    <div className="text-sm text-pos-text">
                      {getApplicabilityText(rule)}
                    </div>
                  </div>

                  {(rule.minAmount || rule.maxAmount) && (
                    <div className="flex justify-between text-sm">
                      {rule.minAmount && (
                        <span className="text-pos-text-muted">
                          Min:{" "}
                          <span className="text-pos-text">
                            ${rule.minAmount}
                          </span>
                        </span>
                      )}
                      {rule.maxAmount && (
                        <span className="text-pos-text-muted">
                          Max:{" "}
                          <span className="text-pos-text">
                            ${rule.maxAmount}
                          </span>
                        </span>
                      )}
                    </div>
                  )}

                  <div className="flex items-center space-x-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleRuleActive(rule.id)}
                      className={`border-pos-secondary ${
                        rule.active
                          ? "text-pos-error hover:text-pos-error"
                          : "text-pos-success hover:text-pos-success"
                      }`}
                    >
                      {rule.active ? (
                        <XCircle className="mr-2 h-4 w-4" />
                      ) : (
                        <CheckCircle className="mr-2 h-4 w-4" />
                      )}
                      {rule.active ? "Deactivate" : "Activate"}
                    </Button>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-pos-secondary text-pos-text-muted hover:text-pos-text"
                          onClick={() => setEditingRule(rule)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-pos-surface border-pos-secondary max-w-3xl max-h-[90vh]">
                        <DialogHeader>
                          <DialogTitle className="text-pos-text">
                            Edit Tax Rule
                          </DialogTitle>
                        </DialogHeader>
                        <TaxRuleForm
                          taxRule={editingRule || undefined}
                          onSave={handleSaveRule}
                          onCancel={() => setEditingRule(null)}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteRule(rule.id)}
                      className="border-pos-secondary text-pos-error hover:text-pos-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredRules.length === 0 && (
            <Card className="bg-pos-surface border-pos-secondary">
              <CardContent className="text-center py-12">
                <FileText className="mx-auto h-12 w-12 text-pos-text-muted mb-4" />
                <h3 className="text-lg font-semibold text-pos-text mb-2">
                  No tax rules found
                </h3>
                <p className="text-pos-text-muted mb-4">
                  {searchQuery
                    ? "Try adjusting your search query"
                    : "Create your first tax rule to handle taxes"}
                </p>
                {!searchQuery && (
                  <Button
                    onClick={() => setIsAddingRule(true)}
                    className="bg-pos-accent hover:bg-pos-accent/90"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Tax Rule
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="calculator">
          <TaxCalculator />
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Users as UsersIcon,
  Save,
  X,
  Star,
  Shield,
  Phone,
  Mail,
  MapPin,
  DollarSign,
  AlertTriangle,
  Crown,
  Ban,
  Award,
  Coins,
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import type { CustomerTag, LoyaltyRule } from "@/shared/api";
import type { BackendCustomer } from "@/shared/api";
import { useAuth } from "@/contexts/AuthContext";
import {
  getAdminCustomers,
  createAdminCustomer,
  updateAdminCustomer,
  deleteAdminCustomer,
} from "@/lib/apiServices";
import { useToast } from "@/contexts/ToastContext";

const mockCustomerTags: CustomerTag[] = [
  { id: "vip", name: "VIP", color: "#FFD700", benefits: ["10% discount on all orders", "Priority seating", "Free dessert"] },
  { id: "premium", name: "Premium", color: "#C0C0C0", benefits: ["5% discount", "Birthday special"] },
  { id: "regular", name: "Regular", color: "#00C853", benefits: ["Loyalty points"] },
  { id: "blacklist", name: "Blacklisted", color: "#F44336", benefits: [] },
  { id: "employee", name: "Employee", color: "#2196F3", benefits: ["Staff discount 15%"] },
];

const mockLoyaltyRules: LoyaltyRule[] = [
  { id: "default", name: "Default Loyalty", earnRate: 1, redeemRate: 100, minRedeemPoints: 500, maxRedeemPercentage: 50, expiryDays: 365, active: true },
  { id: "vip", name: "VIP Loyalty", earnRate: 2, redeemRate: 80, minRedeemPoints: 200, maxRedeemPercentage: 70, expiryDays: undefined, active: true },
];

interface CustomerFormProps {
  customer?: BackendCustomer;
  restaurantId: string;
  onSave: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

function CustomerForm({ customer, restaurantId, onSave, onCancel, isLoading }: CustomerFormProps) {
  const [formData, setFormData] = useState({
    name: customer?.name || "",
    phone: customer?.phone || "",
    email: customer?.email || "",
    address: customer?.address || "",
    notes: customer?.notes || "",
    is_active: customer?.is_active ?? true,
  });

  const handleSubmit = () => {
    onSave({ ...formData, restaurant_id: restaurantId });
  };

  return (
    <div className="space-y-6 max-h-[80vh] overflow-y-auto">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="customer-name" className="text-pos-text">Full Name *</Label>
          <Input
            id="customer-name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-pos-surface border-pos-secondary text-pos-text"
            placeholder="Enter customer name"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="customer-phone" className="text-pos-text">Phone Number</Label>
          <Input
            id="customer-phone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
            className="bg-pos-surface border-pos-secondary text-pos-text"
            placeholder="+1234567890"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer-email" className="text-pos-text">Email Address</Label>
        <Input
          id="customer-email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="bg-pos-surface border-pos-secondary text-pos-text"
          placeholder="customer@email.com"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer-address" className="text-pos-text">Address</Label>
        <Textarea
          id="customer-address"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="bg-pos-surface border-pos-secondary text-pos-text"
          placeholder="Enter customer address"
          rows={2}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="customer-notes" className="text-pos-text">Notes</Label>
        <Textarea
          id="customer-notes"
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="bg-pos-surface border-pos-secondary text-pos-text"
          placeholder="Any special notes about this customer..."
          rows={3}
        />
      </div>

      <div className="flex items-center space-x-3 p-4 bg-pos-error/10 rounded-lg border border-pos-error/20">
        <AlertTriangle className="h-5 w-5 text-pos-error" />
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <Switch
              checked={!formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: !checked })}
            />
            <Label className="text-pos-text font-medium">Deactivate Customer</Label>
          </div>
          <p className="text-sm text-pos-text-muted mt-1">Prevents customer from placing orders</p>
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
          disabled={!formData.name || isLoading}
          className="bg-pos-accent hover:bg-pos-accent/90"
        >
          <Save className="mr-2 h-4 w-4" />
          {isLoading ? "Saving..." : "Save Customer"}
        </Button>
      </div>
    </div>
  );
}

function LoyaltyRuleForm({
  rule,
  onSave,
  onCancel,
}: {
  rule?: LoyaltyRule;
  onSave: (rule: Partial<LoyaltyRule>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: rule?.name || "",
    earnRate: rule?.earnRate || 1,
    redeemRate: rule?.redeemRate || 100,
    minRedeemPoints: rule?.minRedeemPoints || 100,
    maxRedeemPercentage: rule?.maxRedeemPercentage || 50,
    expiryDays: rule?.expiryDays || undefined,
    active: rule?.active ?? true,
  });

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-pos-text">Rule Name</Label>
          <Input
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="bg-pos-surface border-pos-secondary text-pos-text"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-pos-text">Active</Label>
          <div className="flex items-center h-10">
            <Switch
              checked={formData.active}
              onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
            />
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-pos-text">Earn Rate (Points per $1)</Label>
          <Input
            type="number"
            step="0.1"
            min="0"
            value={formData.earnRate}
            onChange={(e) => setFormData({ ...formData, earnRate: parseFloat(e.target.value) || 0 })}
            className="bg-pos-surface border-pos-secondary text-pos-text"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-pos-text">Redeem Rate (Points per $1)</Label>
          <Input
            type="number"
            min="1"
            value={formData.redeemRate}
            onChange={(e) => setFormData({ ...formData, redeemRate: parseInt(e.target.value) || 1 })}
            className="bg-pos-surface border-pos-secondary text-pos-text"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label className="text-pos-text">Min Redeem Points</Label>
          <Input
            type="number"
            min="0"
            value={formData.minRedeemPoints}
            onChange={(e) => setFormData({ ...formData, minRedeemPoints: parseInt(e.target.value) || 0 })}
            className="bg-pos-surface border-pos-secondary text-pos-text"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-pos-text">Max Redeem % of Order</Label>
          <Input
            type="number"
            min="0"
            max="100"
            value={formData.maxRedeemPercentage}
            onChange={(e) => setFormData({ ...formData, maxRedeemPercentage: parseInt(e.target.value) || 0 })}
            className="bg-pos-surface border-pos-secondary text-pos-text"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-pos-text">Expiry Days (empty = no expiry)</Label>
          <Input
            type="number"
            min="1"
            value={formData.expiryDays || ""}
            onChange={(e) =>
              setFormData({ ...formData, expiryDays: e.target.value ? parseInt(e.target.value) : undefined })
            }
            className="bg-pos-surface border-pos-secondary text-pos-text"
          />
        </div>
      </div>
      <div className="flex items-center justify-end space-x-2 pt-4 border-t border-pos-secondary">
        <Button variant="outline" onClick={onCancel} className="border-pos-secondary text-pos-text-muted hover:text-pos-text">Cancel</Button>
        <Button onClick={() => onSave(formData)} disabled={!formData.name} className="bg-pos-accent hover:bg-pos-accent/90">Save Rule</Button>
      </div>
    </div>
  );
}

export default function CustomerManagement() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const restaurantId = user?.branchId ?? "";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("all");
  const [isAddingCustomer, setIsAddingCustomer] = useState(false);
  const [isAddingLoyaltyRule, setIsAddingLoyaltyRule] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<BackendCustomer | null>(null);
  const [editingLoyaltyRule, setEditingLoyaltyRule] = useState<LoyaltyRule | null>(null);
  const [loyaltyRules, setLoyaltyRules] = useState<LoyaltyRule[]>(mockLoyaltyRules);

  const { data: customersData, isLoading } = useQuery({
    queryKey: ["adminCustomers", restaurantId, searchQuery],
    queryFn: () => getAdminCustomers(restaurantId, { search: searchQuery || undefined, limit: 200 }),
    enabled: !!restaurantId,
    select: (r: any) => {
      const src = r?.data ?? r;
      if (src?.customers) return src.customers as BackendCustomer[];
      if (Array.isArray(src)) return src as BackendCustomer[];
      return [] as BackendCustomer[];
    },
    staleTime: 30_000,
  });

  const customers: BackendCustomer[] = customersData ?? [];

  const createMutation = useMutation({
    mutationFn: (data: any) => createAdminCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCustomers", restaurantId] });
      setIsAddingCustomer(false);
      addToast({ type: "success", title: "Customer created successfully" });
    },
    onError: (e: any) => addToast({ type: "error", title: e?.message ?? "Failed to create customer" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => updateAdminCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCustomers", restaurantId] });
      setEditingCustomer(null);
      addToast({ type: "success", title: "Customer updated successfully" });
    },
    onError: (e: any) => addToast({ type: "error", title: e?.message ?? "Failed to update customer" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteAdminCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminCustomers", restaurantId] });
      addToast({ type: "success", title: "Customer deleted" });
    },
    onError: (e: any) => addToast({ type: "error", title: e?.message ?? "Failed to delete customer" }),
  });

  const filteredCustomers = useMemo(() => {
    return customers.filter((c) => {
      const matchesTag =
        selectedTag === "all" ||
        (selectedTag === "blacklisted" && !c.is_active);
      return matchesTag;
    });
  }, [customers, selectedTag]);

  const handleSaveCustomer = (data: any) => {
    if (editingCustomer) {
      updateMutation.mutate({ id: editingCustomer.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleSaveLoyaltyRule = (ruleData: Partial<LoyaltyRule>) => {
    const newRule: LoyaltyRule = {
      id: editingLoyaltyRule?.id || `rule-${Date.now()}`,
      name: ruleData.name!,
      earnRate: ruleData.earnRate!,
      redeemRate: ruleData.redeemRate!,
      minRedeemPoints: ruleData.minRedeemPoints!,
      maxRedeemPercentage: ruleData.maxRedeemPercentage!,
      expiryDays: ruleData.expiryDays,
      active: ruleData.active!,
    };
    if (editingLoyaltyRule) {
      setLoyaltyRules(loyaltyRules.map((r) => (r.id === editingLoyaltyRule.id ? newRule : r)));
      setEditingLoyaltyRule(null);
    } else {
      setLoyaltyRules([...loyaltyRules, newRule]);
      setIsAddingLoyaltyRule(false);
    }
  };

  const formatDate = (dateStr: string | Date | undefined) => {
    if (!dateStr) return "Never";
    return new Date(dateStr as string).toLocaleDateString();
  };

  const totalCustomers = customers.length;
  const activeCustomers = customers.filter((c) => c.is_active).length;
  const inactiveCustomers = customers.filter((c) => !c.is_active).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Customer Management</h1>
          <p className="text-muted-foreground mt-1">Manage customers, tags, and loyalty programs</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isAddingCustomer} onOpenChange={setIsAddingCustomer}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                <Plus className="mr-2 h-4 w-4" />
                Add Customer
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-pos-surface border-pos-secondary max-w-2xl max-h-[90vh]">
              <DialogHeader>
                <DialogTitle className="text-pos-text">Add New Customer</DialogTitle>
              </DialogHeader>
              <CustomerForm
                restaurantId={restaurantId}
                onSave={handleSaveCustomer}
                onCancel={() => setIsAddingCustomer(false)}
                isLoading={createMutation.isPending}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-pos-surface border-pos-secondary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pos-text-muted text-sm">Total Customers</p>
                <p className="text-3xl font-bold text-pos-text">{totalCustomers}</p>
              </div>
              <UsersIcon className="h-8 w-8 text-pos-accent" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-pos-surface border-pos-secondary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pos-text-muted text-sm">Active Customers</p>
                <p className="text-3xl font-bold text-pos-success">{activeCustomers}</p>
              </div>
              <Shield className="h-8 w-8 text-pos-success" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-pos-surface border-pos-secondary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pos-text-muted text-sm">Inactive / Blocked</p>
                <p className="text-3xl font-bold text-pos-warning">{inactiveCustomers}</p>
              </div>
              <Crown className="h-8 w-8 text-pos-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-pos-surface border-pos-secondary">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-pos-text-muted text-sm">Loyalty Rules</p>
                <p className="text-3xl font-bold text-pos-accent">{loyaltyRules.filter((r) => r.active).length}</p>
              </div>
              <Coins className="h-8 w-8 text-pos-accent" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="customers">
        <TabsList className="bg-pos-surface border-pos-secondary">
          <TabsTrigger value="customers" className="data-[state=active]:bg-pos-accent data-[state=active]:text-pos-text">
            <UsersIcon className="mr-2 h-4 w-4" />
            Customers
          </TabsTrigger>
          <TabsTrigger value="loyalty" className="data-[state=active]:bg-pos-accent data-[state=active]:text-pos-text">
            <Award className="mr-2 h-4 w-4" />
            Loyalty Rules
          </TabsTrigger>
        </TabsList>

        <TabsContent value="customers" className="space-y-6">
          <Card className="bg-pos-surface border-pos-secondary">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-pos-text-muted h-4 w-4" />
                  <Input
                    placeholder="Search customers..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-pos-surface border-pos-secondary text-pos-text"
                  />
                </div>
                <Select value={selectedTag} onValueChange={setSelectedTag}>
                  <SelectTrigger className="w-48 bg-pos-surface border-pos-secondary text-pos-text">
                    <SelectValue placeholder="Filter by tag" />
                  </SelectTrigger>
                  <SelectContent className="bg-pos-surface border-pos-secondary">
                    <SelectItem value="all">All Customers</SelectItem>
                    <SelectItem value="blacklisted">Inactive / Blocked</SelectItem>
                    {mockCustomerTags.map((tag) => (
                      <SelectItem key={tag.id} value={tag.id}>{tag.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {isLoading ? (
            <div className="text-center py-12 text-pos-text-muted">Loading customers...</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredCustomers.map((customer) => (
                <Card
                  key={customer.id}
                  className={`bg-pos-surface border-pos-secondary ${!customer.is_active ? "border-pos-error" : ""}`}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-12 w-12">
                          <AvatarFallback className="bg-pos-accent text-pos-text">
                            {customer.name.split(" ").map((n) => n[0]).join("")}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-lg text-pos-text">{customer.name}</CardTitle>
                          {customer.phone && (
                            <div className="flex items-center space-x-1 mt-1">
                              <Phone className="h-3 w-3 text-pos-text-muted" />
                              <span className="text-sm text-pos-text-muted">{customer.phone}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      {!customer.is_active && <Ban className="h-5 w-5 text-pos-error" />}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      {customer.email && (
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="h-3 w-3 text-pos-text-muted" />
                          <span className="text-pos-text-muted">{customer.email}</span>
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-start space-x-2 text-sm">
                          <MapPin className="h-3 w-3 text-pos-text-muted mt-0.5" />
                          <span className="text-pos-text-muted">{customer.address}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1">
                      <Badge
                        style={{
                          backgroundColor: customer.is_active ? "#00C85320" : "#F4433620",
                          color: customer.is_active ? "#00C853" : "#F44336",
                          borderColor: customer.is_active ? "#00C85340" : "#F4433640",
                        }}
                        className="border text-xs"
                      >
                        {customer.is_active ? "Active" : "Inactive"}
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-pos-text-muted">Member Since:</span>
                        <div className="text-pos-text font-bold">{formatDate(customer.created_at)}</div>
                      </div>
                      <div>
                        <span className="text-pos-text-muted">Last Updated:</span>
                        <div className="text-pos-text font-bold">{formatDate(customer.updated_at)}</div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 border-pos-secondary text-pos-text-muted hover:text-pos-text"
                            onClick={() => setEditingCustomer(customer)}
                          >
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="bg-pos-surface border-pos-secondary max-w-2xl max-h-[90vh]">
                          <DialogHeader>
                            <DialogTitle className="text-pos-text">Edit Customer</DialogTitle>
                          </DialogHeader>
                          <CustomerForm
                            customer={editingCustomer || undefined}
                            restaurantId={restaurantId}
                            onSave={handleSaveCustomer}
                            onCancel={() => setEditingCustomer(null)}
                            isLoading={updateMutation.isPending}
                          />
                        </DialogContent>
                      </Dialog>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteMutation.mutate(customer.id)}
                        disabled={deleteMutation.isPending}
                        className="border-pos-secondary text-pos-error hover:text-pos-error"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {customer.notes && (
                      <div className="text-sm p-3 bg-pos-secondary rounded-lg">
                        <div className="text-pos-text-muted mb-1">Notes:</div>
                        <div className="text-pos-text">{customer.notes}</div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {!isLoading && filteredCustomers.length === 0 && (
            <Card className="bg-pos-surface border-pos-secondary">
              <CardContent className="text-center py-12">
                <UsersIcon className="mx-auto h-12 w-12 text-pos-text-muted mb-4" />
                <h3 className="text-lg font-semibold text-pos-text mb-2">No customers found</h3>
                <p className="text-pos-text-muted mb-4">
                  {searchQuery || selectedTag !== "all"
                    ? "Try adjusting your search or filters"
                    : "Add your first customer to get started"}
                </p>
                {!searchQuery && selectedTag === "all" && (
                  <Button onClick={() => setIsAddingCustomer(true)} className="bg-pos-accent hover:bg-pos-accent/90">
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Customer
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="loyalty" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-pos-text">Loyalty Rules</h2>
              <p className="text-pos-text-muted">Configure how customers earn and redeem loyalty points</p>
            </div>
            <Dialog open={isAddingLoyaltyRule} onOpenChange={setIsAddingLoyaltyRule}>
              <DialogTrigger asChild>
                <Button className="bg-pos-accent hover:bg-pos-accent/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Loyalty Rule
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-pos-surface border-pos-secondary max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-pos-text">Create Loyalty Rule</DialogTitle>
                </DialogHeader>
                <LoyaltyRuleForm
                  onSave={handleSaveLoyaltyRule}
                  onCancel={() => setIsAddingLoyaltyRule(false)}
                />
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loyaltyRules.map((rule) => (
              <Card key={rule.id} className="bg-pos-surface border-pos-secondary">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-pos-text">{rule.name}</CardTitle>
                    <Badge className={rule.active ? "bg-pos-success text-pos-text" : "bg-pos-error text-pos-text"}>
                      {rule.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-pos-text-muted">Earn Rate:</span>
                      <div className="text-pos-text font-bold">{rule.earnRate} pts/$1</div>
                    </div>
                    <div>
                      <span className="text-pos-text-muted">Redeem Rate:</span>
                      <div className="text-pos-text font-bold">{rule.redeemRate} pts/$1</div>
                    </div>
                    <div>
                      <span className="text-pos-text-muted">Min Redeem:</span>
                      <div className="text-pos-text font-bold">{rule.minRedeemPoints} pts</div>
                    </div>
                    <div>
                      <span className="text-pos-text-muted">Max Redeem:</span>
                      <div className="text-pos-text font-bold">{rule.maxRedeemPercentage}%</div>
                    </div>
                  </div>
                  {rule.expiryDays && (
                    <div className="text-sm">
                      <span className="text-pos-text-muted">Points Expiry:</span>
                      <span className="text-pos-text font-bold ml-2">{rule.expiryDays} days</span>
                    </div>
                  )}
                  <div className="flex items-center space-x-2 pt-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-pos-secondary text-pos-text-muted hover:text-pos-text"
                          onClick={() => setEditingLoyaltyRule(rule)}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-pos-surface border-pos-secondary max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-pos-text">Edit Loyalty Rule</DialogTitle>
                        </DialogHeader>
                        <LoyaltyRuleForm
                          rule={editingLoyaltyRule || undefined}
                          onSave={handleSaveLoyaltyRule}
                          onCancel={() => setEditingLoyaltyRule(null)}
                        />
                      </DialogContent>
                    </Dialog>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setLoyaltyRules(loyaltyRules.filter((r) => r.id !== rule.id))}
                      className="border-pos-secondary text-pos-error hover:text-pos-error"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

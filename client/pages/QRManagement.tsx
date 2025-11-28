import { useState } from "react";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  QrCode,
  Download,
  Eye,
  Copy,
  Users,
  MapPin,
  Settings as SettingsIcon,
  Printer,
  RefreshCw,
  CheckCircle,
  XCircle,
  Clock,
  DollarSign,
  TrendingUp,
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
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/contexts/ToastContext";
import type { QRTable, QRSession, QRSettings } from "@/shared/api";

// Mock data for QR tables
const mockQRTables: QRTable[] = [
  {
    id: "table-1",
    tableNumber: "T-01",
    tableName: "Table 1",
    location: "Main Floor",
    capacity: 4,
    qrCodeUrl: "https://yourpos.com/qr-order/TABLE-01-abc123",
    qrToken: "abc123def456",
    isActive: true,
    isOccupied: false,
    createdAt: new Date("2024-01-01"),
    lastUsed: new Date("2024-01-20"),
  },
  {
    id: "table-2",
    tableNumber: "T-02",
    tableName: "Table 2",
    location: "Main Floor",
    capacity: 2,
    qrCodeUrl: "https://yourpos.com/qr-order/TABLE-02-def456",
    qrToken: "def456ghi789",
    isActive: true,
    isOccupied: true,
    currentSessionId: "session-123",
    createdAt: new Date("2024-01-01"),
    lastUsed: new Date("2024-01-21"),
  },
  {
    id: "table-3",
    tableNumber: "T-03",
    tableName: "VIP Table",
    location: "VIP Section",
    capacity: 6,
    qrCodeUrl: "https://yourpos.com/qr-order/TABLE-03-ghi789",
    qrToken: "ghi789jkl012",
    isActive: false,
    isOccupied: false,
    createdAt: new Date("2024-01-01"),
  },
];

const mockQRSettings: QRSettings = {
  id: "settings-1",
  restaurantName: "RestaurantPOS",
  primaryColor: "#00A19D",
  accentColor: "#FF6D00",
  enableOnlineOrdering: true,
  enablePaymentAtTable: true,
  enableOnlinePayment: false,
  serviceChargePercentage: 10,
  autoConfirmOrders: false,
  orderTimeoutMinutes: 30,
  maxOrdersPerSession: 10,
  enableCustomerInfo: false,
  enableSpecialInstructions: true,
  enableOrderTracking: true,
  welcomeMessage:
    "Welcome! Please scan the QR code to view our menu and place your order.",
  contactInfo: {
    phone: "+1 (555) 123-4567",
    email: "orders@restaurantpos.com",
    address: "123 Restaurant Street, Food City, FC 12345",
  },
  businessHours: {
    monday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
    tuesday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
    wednesday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
    thursday: { isOpen: true, openTime: "09:00", closeTime: "22:00" },
    friday: { isOpen: true, openTime: "09:00", closeTime: "23:00" },
    saturday: { isOpen: true, openTime: "09:00", closeTime: "23:00" },
    sunday: { isOpen: true, openTime: "10:00", closeTime: "21:00" },
  },
  paymentGateways: [],
};

interface TableFormProps {
  table?: QRTable;
  onSave: (table: Partial<QRTable>) => void;
  onCancel: () => void;
}

function TableForm({ table, onSave, onCancel }: TableFormProps) {
  const [formData, setFormData] = useState({
    tableNumber: table?.tableNumber || "",
    tableName: table?.tableName || "",
    location: table?.location || "Main Floor",
    capacity: table?.capacity || 4,
    isActive: table?.isActive ?? true,
  });

  const handleSubmit = () => {
    const newToken = `${formData.tableNumber.toLowerCase()}-${Math.random().toString(36).substr(2, 9)}`;
    onSave({
      ...formData,
      qrToken: newToken,
      qrCodeUrl: `https://yourpos.com/qr-order/${formData.tableNumber.toUpperCase()}-${newToken}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="table-number" className="text-foreground">
            Table Number *
          </Label>
          <Input
            id="table-number"
            value={formData.tableNumber}
            onChange={(e) =>
              setFormData({ ...formData, tableNumber: e.target.value })
            }
            className="bg-background border-border text-foreground"
            placeholder="T-01"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="table-name" className="text-foreground">
            Table Name
          </Label>
          <Input
            id="table-name"
            value={formData.tableName}
            onChange={(e) =>
              setFormData({ ...formData, tableName: e.target.value })
            }
            className="bg-background border-border text-foreground"
            placeholder="Table 1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location" className="text-foreground">
            Location/Section
          </Label>
          <Select
            value={formData.location}
            onValueChange={(value) =>
              setFormData({ ...formData, location: value })
            }
          >
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="Main Floor">Main Floor</SelectItem>
              <SelectItem value="VIP Section">VIP Section</SelectItem>
              <SelectItem value="Outdoor">Outdoor</SelectItem>
              <SelectItem value="Private Dining">Private Dining</SelectItem>
              <SelectItem value="Bar Area">Bar Area</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity" className="text-foreground">
            Capacity (People)
          </Label>
          <Input
            id="capacity"
            type="number"
            min="1"
            max="20"
            value={formData.capacity}
            onChange={(e) =>
              setFormData({
                ...formData,
                capacity: parseInt(e.target.value) || 1,
              })
            }
            className="bg-background border-border text-foreground"
          />
        </div>
      </div>

      <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
        <Switch
          checked={formData.isActive}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, isActive: checked })
          }
        />
        <div>
          <Label className="text-foreground font-medium">
            Enable QR Ordering
          </Label>
          <p className="text-sm text-muted-foreground">
            Allow customers to scan and order from this table
          </p>
        </div>
      </div>

      <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-border text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!formData.tableNumber}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {table ? "Update Table" : "Create Table"}
        </Button>
      </div>
    </div>
  );
}

function QRCodePreview({ table }: { table: QRTable }) {
  const { addToast } = useToast();

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    addToast({
      type: "success",
      title: "Copied!",
      description: "QR code URL copied to clipboard",
    });
  };

  const downloadQRCode = () => {
    // In a real implementation, this would generate and download the QR code
    addToast({
      type: "success",
      title: "QR Code Downloaded",
      description: `QR code for ${table.tableName} downloaded successfully`,
    });
  };

  const printQRCode = () => {
    // In a real implementation, this would open print dialog
    addToast({
      type: "info",
      title: "Print QR Code",
      description: `Opening print dialog for ${table.tableName}`,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center space-y-4">
        <div className="mx-auto w-48 h-48 bg-muted border-2 border-dashed border-border rounded-lg flex items-center justify-center">
          <div className="text-center">
            <QrCode className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">QR Code Preview</p>
            <p className="text-xs text-muted-foreground">{table.tableNumber}</p>
          </div>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            {table.tableName}
          </h3>
          <Badge className="bg-blue-500 text-white">{table.location}</Badge>
          <Badge className="bg-green-500 text-white">
            <Users className="h-3 w-3 mr-1" />
            {table.capacity} seats
          </Badge>
        </div>
      </div>

      <div className="space-y-3">
        <div className="space-y-2">
          <Label className="text-foreground text-sm font-medium">
            QR Code URL:
          </Label>
          <div className="flex items-center space-x-2">
            <Input
              value={table.qrCodeUrl}
              readOnly
              className="bg-muted border-border text-foreground text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(table.qrCodeUrl)}
              className="border-border"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-foreground text-sm font-medium">
            Security Token:
          </Label>
          <div className="flex items-center space-x-2">
            <Input
              value={table.qrToken}
              readOnly
              className="bg-muted border-border text-foreground text-xs"
            />
            <Button
              variant="outline"
              size="sm"
              onClick={() => copyToClipboard(table.qrToken)}
              className="border-border"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        <Button
          onClick={downloadQRCode}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          <Download className="mr-2 h-4 w-4" />
          Download QR Code
        </Button>
        <Button
          variant="outline"
          onClick={() => window.open(`/qr-menu/${table.qrToken}`, "_blank")}
          className="border-border text-foreground"
        >
          <Eye className="mr-2 h-4 w-4" />
          Test Menu
        </Button>
        <Button
          variant="outline"
          onClick={printQRCode}
          className="border-border text-foreground"
        >
          <Printer className="mr-2 h-4 w-4" />
          Print QR Sticker
        </Button>
      </div>
    </div>
  );
}

function QRSettingsForm() {
  const [settings, setSettings] = useState(mockQRSettings);
  const { addToast } = useToast();

  const handleSave = () => {
    addToast({
      type: "success",
      title: "Settings Saved",
      description: "QR ordering settings updated successfully",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Restaurant Name</Label>
              <Input
                value={settings.restaurantName}
                onChange={(e) =>
                  setSettings({ ...settings, restaurantName: e.target.value })
                }
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Service Charge (%)</Label>
              <Input
                type="number"
                value={settings.serviceChargePercentage}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    serviceChargePercentage: parseFloat(e.target.value) || 0,
                  })
                }
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Welcome Message</Label>
            <Textarea
              value={settings.welcomeMessage}
              onChange={(e) =>
                setSettings({ ...settings, welcomeMessage: e.target.value })
              }
              className="bg-background border-border text-foreground"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Feature Toggles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="font-medium text-foreground">
                  Online Ordering
                </div>
                <div className="text-sm text-muted-foreground">
                  Allow customers to place orders via QR
                </div>
              </div>
              <Switch
                checked={settings.enableOnlineOrdering}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableOnlineOrdering: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="font-medium text-foreground">Pay at Table</div>
                <div className="text-sm text-muted-foreground">
                  Allow customers to pay later
                </div>
              </div>
              <Switch
                checked={settings.enablePaymentAtTable}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enablePaymentAtTable: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="font-medium text-foreground">
                  Online Payment
                </div>
                <div className="text-sm text-muted-foreground">
                  Enable online payment gateways
                </div>
              </div>
              <Switch
                checked={settings.enableOnlinePayment}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableOnlinePayment: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="font-medium text-foreground">
                  Order Tracking
                </div>
                <div className="text-sm text-muted-foreground">
                  Real-time order status updates
                </div>
              </div>
              <Switch
                checked={settings.enableOrderTracking}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableOrderTracking: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        Save QR Settings
      </Button>
    </div>
  );
}

export default function QRManagement() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedLocation, setSelectedLocation] = useState("all");
  const [isAddingTable, setIsAddingTable] = useState(false);
  const [editingTable, setEditingTable] = useState<QRTable | null>(null);
  const [previewTable, setPreviewTable] = useState<QRTable | null>(null);
  const [tables, setTables] = useState<QRTable[]>(mockQRTables);

  const filteredTables = tables.filter((table) => {
    const matchesSearch =
      table.tableNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      table.tableName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLocation =
      selectedLocation === "all" || table.location === selectedLocation;
    return matchesSearch && matchesLocation;
  });

  const handleSaveTable = (tableData: Partial<QRTable>) => {
    const newTable: QRTable = {
      id: editingTable?.id || `table-${Date.now()}`,
      tableNumber: tableData.tableNumber!,
      tableName: tableData.tableName || tableData.tableNumber!,
      location: tableData.location!,
      capacity: tableData.capacity!,
      qrCodeUrl: tableData.qrCodeUrl!,
      qrToken: tableData.qrToken!,
      isActive: tableData.isActive!,
      isOccupied: editingTable?.isOccupied || false,
      currentSessionId: editingTable?.currentSessionId,
      createdAt: editingTable?.createdAt || new Date(),
      lastUsed: editingTable?.lastUsed,
    };

    if (editingTable) {
      setTables(tables.map((t) => (t.id === editingTable.id ? newTable : t)));
      setEditingTable(null);
    } else {
      setTables([...tables, newTable]);
      setIsAddingTable(false);
    }
  };

  const deleteTable = (tableId: string) => {
    setTables(tables.filter((t) => t.id !== tableId));
  };

  const toggleTableStatus = (tableId: string) => {
    setTables(
      tables.map((table) =>
        table.id === tableId ? { ...table, isActive: !table.isActive } : table,
      ),
    );
  };

  const getTableStats = () => {
    return {
      total: tables.length,
      active: tables.filter((t) => t.isActive).length,
      occupied: tables.filter((t) => t.isOccupied).length,
      available: tables.filter((t) => t.isActive && !t.isOccupied).length,
    };
  };

  const stats = getTableStats();
  const locations = Array.from(new Set(tables.map((t) => t.location)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">QR Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage QR codes, tables, and ordering settings
          </p>
        </div>
        <Dialog open={isAddingTable} onOpenChange={setIsAddingTable}>
          <DialogTrigger asChild>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
              <Plus className="mr-2 h-4 w-4" />
              Add Table
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-card-foreground">
                Add New Table
              </DialogTitle>
            </DialogHeader>
            <TableForm
              onSave={handleSaveTable}
              onCancel={() => setIsAddingTable(false)}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-foreground">
                {stats.total}
              </div>
              <div className="text-sm text-muted-foreground">Total Tables</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-500">
                {stats.active}
              </div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-500">
                {stats.occupied}
              </div>
              <div className="text-sm text-muted-foreground">Occupied</div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-500">
                {stats.available}
              </div>
              <div className="text-sm text-muted-foreground">Available</div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="tables">
        <TabsList className="bg-muted border-border">
          <TabsTrigger
            value="tables"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <QrCode className="mr-2 h-4 w-4" />
            Tables & QR Codes
          </TabsTrigger>
          <TabsTrigger
            value="settings"
            className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
          >
            <SettingsIcon className="mr-2 h-4 w-4" />
            QR Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tables" className="space-y-6">
          {/* Filters */}
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center space-x-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                  <Input
                    placeholder="Search tables..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-background border-border text-foreground"
                  />
                </div>
                <Select
                  value={selectedLocation}
                  onValueChange={setSelectedLocation}
                >
                  <SelectTrigger className="w-48 bg-background border-border text-foreground">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="all">All Locations</SelectItem>
                    {locations.map((location) => (
                      <SelectItem key={location} value={location}>
                        {location}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Tables Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTables.map((table) => (
              <Card
                key={table.id}
                className={`bg-card border-border ${
                  !table.isActive ? "opacity-60" : ""
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg text-card-foreground flex items-center">
                        {table.tableName}
                        {table.isOccupied && (
                          <Badge className="ml-2 bg-red-500 text-white">
                            Occupied
                          </Badge>
                        )}
                      </CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        {table.tableNumber} • {table.location}
                      </p>
                    </div>
                    <div className="flex items-center space-x-1">
                      {table.isActive ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Capacity:</span>
                    <span className="text-foreground flex items-center">
                      <Users className="h-3 w-3 mr-1" />
                      {table.capacity} people
                    </span>
                  </div>

                  {table.lastUsed && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Used:</span>
                      <span className="text-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {table.lastUsed.toLocaleDateString()}
                      </span>
                    </div>
                  )}

                  <div className="text-xs text-muted-foreground bg-muted p-2 rounded font-mono">
                    {table.qrCodeUrl}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1 border-border text-foreground"
                          onClick={() => setPreviewTable(table)}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          Preview
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border max-w-md">
                        <DialogHeader>
                          <DialogTitle className="text-card-foreground">
                            QR Code Preview
                          </DialogTitle>
                        </DialogHeader>
                        {previewTable && <QRCodePreview table={previewTable} />}
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        window.open(`/qr-menu/${table.qrToken}`, "_blank")
                      }
                      className="border-border text-blue-600 hover:text-blue-700"
                      title="Test customer menu experience"
                    >
                      <QrCode className="h-4 w-4" />
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleTableStatus(table.id)}
                      className={`border-border ${
                        table.isActive
                          ? "text-red-500 hover:text-red-500"
                          : "text-green-500 hover:text-green-500"
                      }`}
                    >
                      {table.isActive ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <CheckCircle className="h-4 w-4" />
                      )}
                    </Button>

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          className="border-border text-muted-foreground hover:text-foreground"
                          onClick={() => setEditingTable(table)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="bg-card border-border max-w-2xl">
                        <DialogHeader>
                          <DialogTitle className="text-card-foreground">
                            Edit Table
                          </DialogTitle>
                        </DialogHeader>
                        <TableForm
                          table={editingTable || undefined}
                          onSave={handleSaveTable}
                          onCancel={() => setEditingTable(null)}
                        />
                      </DialogContent>
                    </Dialog>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTable(table.id)}
                      className="border-border text-red-500 hover:text-red-500"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredTables.length === 0 && (
            <Card className="bg-card border-border">
              <CardContent className="text-center py-12">
                <QrCode className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  No tables found
                </h3>
                <p className="text-muted-foreground mb-4">
                  {searchQuery || selectedLocation !== "all"
                    ? "Try adjusting your search or filters"
                    : "Create your first QR table to get started"}
                </p>
                {!searchQuery && selectedLocation === "all" && (
                  <Button
                    onClick={() => setIsAddingTable(true)}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add First Table
                  </Button>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="settings">
          <QRSettingsForm />
        </TabsContent>
      </Tabs>
    </div>
  );
}

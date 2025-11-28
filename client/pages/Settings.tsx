import { useState } from "react";
import {
  Save,
  Building,
  CreditCard,
  Printer,
  Bell,
  Shield,
  Database,
  Palette,
  Globe,
  Clock,
  DollarSign,
  Percent,
  Download,
  Upload,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";

interface StoreSettings {
  name: string;
  address: string;
  phone: string;
  email: string;
  website: string;
  logo?: string;
  currency: string;
  timezone: string;
  taxRate: number;
  serviceCharge: number;
  openingHours: {
    [key: string]: { open: string; close: string; closed: boolean };
  };
}

interface PaymentSettings {
  cashEnabled: boolean;
  cardEnabled: boolean;
  upiEnabled: boolean;
  walletEnabled: boolean;
  splitPaymentEnabled: boolean;
  tipEnabled: boolean;
  defaultTipPercentage: number;
  autoSettlement: boolean;
}

interface PrinterSettings {
  kotPrinter: string;
  billPrinter: string;
  kitchenPrinter: string;
  autoPrintKOT: boolean;
  autoPrintBill: boolean;
  paperSize: string;
  logoOnReceipt: boolean;
}

interface NotificationSettings {
  orderNotifications: boolean;
  lowStockAlerts: boolean;
  staffAttendance: boolean;
  dailyReports: boolean;
  emailNotifications: boolean;
  smsNotifications: boolean;
  pushNotifications: boolean;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState("store");

  // Mock settings data
  const [storeSettings, setStoreSettings] = useState<StoreSettings>({
    name: "RestaurantPOS",
    address: "123 Main Street, Downtown, City 12345",
    phone: "+1 (555) 123-4567",
    email: "info@restaurantpos.com",
    website: "www.restaurantpos.com",
    currency: "USD",
    timezone: "America/New_York",
    taxRate: 8.5,
    serviceCharge: 10,
    openingHours: {
      Monday: { open: "09:00", close: "22:00", closed: false },
      Tuesday: { open: "09:00", close: "22:00", closed: false },
      Wednesday: { open: "09:00", close: "22:00", closed: false },
      Thursday: { open: "09:00", close: "22:00", closed: false },
      Friday: { open: "09:00", close: "23:00", closed: false },
      Saturday: { open: "09:00", close: "23:00", closed: false },
      Sunday: { open: "10:00", close: "21:00", closed: false },
    },
  });

  const [paymentSettings, setPaymentSettings] = useState<PaymentSettings>({
    cashEnabled: true,
    cardEnabled: true,
    upiEnabled: true,
    walletEnabled: false,
    splitPaymentEnabled: true,
    tipEnabled: true,
    defaultTipPercentage: 15,
    autoSettlement: false,
  });

  const [printerSettings, setPrinterSettings] = useState<PrinterSettings>({
    kotPrinter: "Kitchen Printer 1",
    billPrinter: "Epson TM-T88V",
    kitchenPrinter: "Kitchen Printer 1",
    autoPrintKOT: true,
    autoPrintBill: false,
    paperSize: "80mm",
    logoOnReceipt: true,
  });

  const [notificationSettings, setNotificationSettings] =
    useState<NotificationSettings>({
      orderNotifications: true,
      lowStockAlerts: true,
      staffAttendance: false,
      dailyReports: true,
      emailNotifications: true,
      smsNotifications: false,
      pushNotifications: true,
    });

  const handleSaveSettings = (category: string) => {
    console.log(`Saving ${category} settings`);
    // Save settings logic here
  };

  const handleBackup = () => {
    console.log("Creating backup...");
  };

  const handleRestore = () => {
    console.log("Restoring backup...");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-foreground-muted mt-1">
            System configuration and preferences
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            className="border-pos-secondary text-foreground-muted hover:text-foreground"
            onClick={handleBackup}
          >
            <Download className="mr-2 h-4 w-4" />
            Backup
          </Button>
          <Button
            variant="outline"
            className="border-pos-secondary text-foreground-muted hover:text-foreground"
            onClick={handleRestore}
          >
            <Upload className="mr-2 h-4 w-4" />
            Restore
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-card border-border mb-6">
          <TabsTrigger
            value="store"
            className="data-[state=active]:bg-pos-accent data-[state=active]:text-foreground"
          >
            <Building className="mr-2 h-4 w-4" />
            Store
          </TabsTrigger>
          <TabsTrigger
            value="payments"
            className="data-[state=active]:bg-pos-accent data-[state=active]:text-foreground"
          >
            <CreditCard className="mr-2 h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger
            value="printers"
            className="data-[state=active]:bg-pos-accent data-[state=active]:text-foreground"
          >
            <Printer className="mr-2 h-4 w-4" />
            Printers
          </TabsTrigger>
          <TabsTrigger
            value="notifications"
            className="data-[state=active]:bg-pos-accent data-[state=active]:text-foreground"
          >
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger
            value="security"
            className="data-[state=active]:bg-pos-accent data-[state=active]:text-foreground"
          >
            <Shield className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger
            value="system"
            className="data-[state=active]:bg-pos-accent data-[state=active]:text-foreground"
          >
            <Database className="mr-2 h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Store Settings Tab */}
        <TabsContent value="store" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Store Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="storeName" className="text-foreground">
                    Store Name
                  </Label>
                  <Input
                    id="storeName"
                    value={storeSettings.name}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        name: e.target.value,
                      })
                    }
                    className="bg-card border-border text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address" className="text-foreground">
                    Address
                  </Label>
                  <Textarea
                    id="address"
                    value={storeSettings.address}
                    onChange={(e) =>
                      setStoreSettings({
                        ...storeSettings,
                        address: e.target.value,
                      })
                    }
                    className="bg-card border-border text-foreground"
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone" className="text-foreground">
                      Phone
                    </Label>
                    <Input
                      id="phone"
                      value={storeSettings.phone}
                      onChange={(e) =>
                        setStoreSettings({
                          ...storeSettings,
                          phone: e.target.value,
                        })
                      }
                      className="bg-card border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email" className="text-foreground">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={storeSettings.email}
                      onChange={(e) =>
                        setStoreSettings({
                          ...storeSettings,
                          email: e.target.value,
                        })
                      }
                      className="bg-card border-border text-foreground"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => handleSaveSettings("store")}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Store Settings
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Regional Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-foreground">
                    Currency
                  </Label>
                  <Select
                    value={storeSettings.currency}
                    onValueChange={(value) =>
                      setStoreSettings({ ...storeSettings, currency: value })
                    }
                  >
                    <SelectTrigger className="bg-card border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="USD">USD - US Dollar</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="GBP">GBP - British Pound</SelectItem>
                      <SelectItem value="CAD">CAD - Canadian Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-foreground">
                    Timezone
                  </Label>
                  <Select
                    value={storeSettings.timezone}
                    onValueChange={(value) =>
                      setStoreSettings({ ...storeSettings, timezone: value })
                    }
                  >
                    <SelectTrigger className="bg-card border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="America/New_York">
                        Eastern Time
                      </SelectItem>
                      <SelectItem value="America/Chicago">
                        Central Time
                      </SelectItem>
                      <SelectItem value="America/Denver">
                        Mountain Time
                      </SelectItem>
                      <SelectItem value="America/Los_Angeles">
                        Pacific Time
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate" className="text-foreground">
                      Tax Rate (%)
                    </Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.1"
                      value={storeSettings.taxRate}
                      onChange={(e) =>
                        setStoreSettings({
                          ...storeSettings,
                          taxRate: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="bg-card border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceCharge" className="text-foreground">
                      Service Charge (%)
                    </Label>
                    <Input
                      id="serviceCharge"
                      type="number"
                      step="0.1"
                      value={storeSettings.serviceCharge}
                      onChange={(e) =>
                        setStoreSettings({
                          ...storeSettings,
                          serviceCharge: parseFloat(e.target.value) || 0,
                        })
                      }
                      className="bg-card border-border text-foreground"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Opening Hours */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Opening Hours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(storeSettings.openingHours).map(
                  ([day, hours]) => (
                    <div
                      key={day}
                      className="flex items-center justify-between p-3 bg-muted rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-20">
                          <span className="font-medium text-foreground">
                            {day}
                          </span>
                        </div>
                        <Switch
                          checked={!hours.closed}
                          onCheckedChange={(checked) => {
                            const newHours = {
                              ...storeSettings.openingHours,
                              [day]: { ...hours, closed: !checked },
                            };
                            setStoreSettings({
                              ...storeSettings,
                              openingHours: newHours,
                            });
                          }}
                        />
                        <span className="text-foreground-muted text-sm">
                          {hours.closed ? "Closed" : "Open"}
                        </span>
                      </div>
                      {!hours.closed && (
                        <div className="flex items-center space-x-2">
                          <Input
                            type="time"
                            value={hours.open}
                            onChange={(e) => {
                              const newHours = {
                                ...storeSettings.openingHours,
                                [day]: { ...hours, open: e.target.value },
                              };
                              setStoreSettings({
                                ...storeSettings,
                                openingHours: newHours,
                              });
                            }}
                            className="w-24 bg-card border-border text-foreground"
                          />
                          <span className="text-foreground-muted">to</span>
                          <Input
                            type="time"
                            value={hours.close}
                            onChange={(e) => {
                              const newHours = {
                                ...storeSettings.openingHours,
                                [day]: { ...hours, close: e.target.value },
                              };
                              setStoreSettings({
                                ...storeSettings,
                                openingHours: newHours,
                              });
                            }}
                            className="w-24 bg-card border-border text-foreground"
                          />
                        </div>
                      )}
                    </div>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings Tab */}
        <TabsContent value="payments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Payment Methods
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    key: "cashEnabled",
                    label: "Cash Payments",
                    icon: DollarSign,
                  },
                  {
                    key: "cardEnabled",
                    label: "Card Payments",
                    icon: CreditCard,
                  },
                  { key: "upiEnabled", label: "UPI Payments", icon: Globe },
                  {
                    key: "walletEnabled",
                    label: "Digital Wallet",
                    icon: CreditCard,
                  },
                ].map(({ key, label, icon: Icon }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 text-pos-accent" />
                      <span className="text-foreground">{label}</span>
                    </div>
                    <Switch
                      checked={
                        paymentSettings[key as keyof PaymentSettings] as boolean
                      }
                      onCheckedChange={(checked) =>
                        setPaymentSettings({
                          ...paymentSettings,
                          [key]: checked,
                        })
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Payment Features
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-foreground">Split Payments</span>
                  <Switch
                    checked={paymentSettings.splitPaymentEnabled}
                    onCheckedChange={(checked) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        splitPaymentEnabled: checked,
                      })
                    }
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-foreground">Tips Enabled</span>
                  <Switch
                    checked={paymentSettings.tipEnabled}
                    onCheckedChange={(checked) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        tipEnabled: checked,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Default Tip (%)</Label>
                  <Input
                    type="number"
                    value={paymentSettings.defaultTipPercentage}
                    onChange={(e) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        defaultTipPercentage: parseInt(e.target.value) || 0,
                      })
                    }
                    className="bg-card border-border text-foreground"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-foreground">Auto Settlement</span>
                  <Switch
                    checked={paymentSettings.autoSettlement}
                    onCheckedChange={(checked) =>
                      setPaymentSettings({
                        ...paymentSettings,
                        autoSettlement: checked,
                      })
                    }
                  />
                </div>
                <Button
                  onClick={() => handleSaveSettings("payments")}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Payment Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Printer Settings Tab */}
        <TabsContent value="printers" className="space-y-6">
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">
                Printer Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">KOT Printer</Label>
                  <Select value={printerSettings.kotPrinter}>
                    <SelectTrigger className="bg-card border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="Kitchen Printer 1">
                        Kitchen Printer 1
                      </SelectItem>
                      <SelectItem value="Kitchen Printer 2">
                        Kitchen Printer 2
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Bill Printer</Label>
                  <Select value={printerSettings.billPrinter}>
                    <SelectTrigger className="bg-card border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="Epson TM-T88V">
                        Epson TM-T88V
                      </SelectItem>
                      <SelectItem value="Star TSP143III">
                        Star TSP143III
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Paper Size</Label>
                  <Select value={printerSettings.paperSize}>
                    <SelectTrigger className="bg-card border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="80mm">80mm</SelectItem>
                      <SelectItem value="58mm">58mm</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator className="bg-muted" />

              <div className="space-y-4">
                <Label className="text-foreground text-lg font-medium">
                  Auto Print Settings
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-foreground">Auto Print KOT</span>
                    <Switch
                      checked={printerSettings.autoPrintKOT}
                      onCheckedChange={(checked) =>
                        setPrinterSettings({
                          ...printerSettings,
                          autoPrintKOT: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-foreground">Auto Print Bill</span>
                    <Switch
                      checked={printerSettings.autoPrintBill}
                      onCheckedChange={(checked) =>
                        setPrinterSettings({
                          ...printerSettings,
                          autoPrintBill: checked,
                        })
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-foreground">Logo on Receipt</span>
                    <Switch
                      checked={printerSettings.logoOnReceipt}
                      onCheckedChange={(checked) =>
                        setPrinterSettings({
                          ...printerSettings,
                          logoOnReceipt: checked,
                        })
                      }
                    />
                  </div>
                </div>
              </div>

              <Button
                onClick={() => handleSaveSettings("printers")}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                <Save className="mr-2 h-4 w-4" />
                Save Printer Settings
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Alert Types</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "orderNotifications", label: "New Orders" },
                  { key: "lowStockAlerts", label: "Low Stock Alerts" },
                  { key: "staffAttendance", label: "Staff Attendance" },
                  { key: "dailyReports", label: "Daily Reports" },
                ].map(({ key, label }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <span className="text-foreground">{label}</span>
                    <Switch
                      checked={
                        notificationSettings[
                          key as keyof NotificationSettings
                        ] as boolean
                      }
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          [key]: checked,
                        })
                      }
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Delivery Channels
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "emailNotifications", label: "Email Notifications" },
                  { key: "smsNotifications", label: "SMS Notifications" },
                  { key: "pushNotifications", label: "Push Notifications" },
                ].map(({ key, label }) => (
                  <div
                    key={key}
                    className="flex items-center justify-between p-3 bg-muted rounded-lg"
                  >
                    <span className="text-foreground">{label}</span>
                    <Switch
                      checked={
                        notificationSettings[
                          key as keyof NotificationSettings
                        ] as boolean
                      }
                      onCheckedChange={(checked) =>
                        setNotificationSettings({
                          ...notificationSettings,
                          [key]: checked,
                        })
                      }
                    />
                  </div>
                ))}
                <Button
                  onClick={() => handleSaveSettings("notifications")}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Notification Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Password Policy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-foreground text-sm">
                      Minimum 8 characters
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-foreground text-sm">
                      Require uppercase letters
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-foreground text-sm">
                      Require numbers
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-foreground text-sm">
                      Password expiry: 90 days
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Session Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">
                    Auto-logout after (minutes)
                  </Label>
                  <Input
                    type="number"
                    defaultValue="30"
                    onChange={(e) => {
                      console.log(
                        "Auto-logout timeout changed:",
                        e.target.value,
                      );
                    }}
                    className="bg-card border-border text-foreground"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-foreground">Require 2FA</span>
                  <Switch
                    onCheckedChange={(checked) => {
                      console.log("2FA toggled:", checked);
                    }}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-foreground">Login Notifications</span>
                  <Switch
                    defaultChecked
                    onCheckedChange={(checked) => {
                      console.log("Login notifications toggled:", checked);
                    }}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* System Tab */}
        <TabsContent value="system" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">System Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Database</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-500 text-sm">Connected</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Payment Gateway</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-green-500 text-sm">Active</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Printer Connection</span>
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-yellow-500 text-sm">Warning</span>
                    </div>
                  </div>
                </div>
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Refresh Status
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">
                  Backup & Maintenance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Last Backup</span>
                    <span className="text-foreground-muted text-sm">
                      2 hours ago
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Database Size</span>
                    <span className="text-foreground-muted text-sm">
                      245 MB
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">System Version</span>
                    <span className="text-foreground-muted text-sm">
                      v2.1.0
                    </span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full border-pos-secondary text-foreground-muted hover:text-foreground"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Create Backup
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full border-pos-secondary text-foreground-muted hover:text-foreground"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Check Updates
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

import { useState, useEffect, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Save,
  Building,
  CreditCard,
  Printer,
  Bell,
  Shield,
  Database,
  Globe,
  IndianRupee,
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
import { useAuth } from "@/contexts/AuthContext";
import {
  getRestaurantById,
  updateRestaurant,
  getActivePrinter,
  saveReceiptPrinter,
  type ReceiptPrinterActiveConfig,
} from "@/lib/apiServices";
import { fetchBridgePrinters, sendTestPrint } from "@/lib/printBridge";
import { buildSampleReceipt, RECEIPT_LINE_WIDTH } from "@/lib/receiptPreview";
import { useToast } from "@/contexts/ToastContext";

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

const defaultOpeningHours = {
  Monday: { open: "09:00", close: "22:00", closed: false },
  Tuesday: { open: "09:00", close: "22:00", closed: false },
  Wednesday: { open: "09:00", close: "22:00", closed: false },
  Thursday: { open: "09:00", close: "22:00", closed: false },
  Friday: { open: "09:00", close: "23:00", closed: false },
  Saturday: { open: "09:00", close: "23:00", closed: false },
  Sunday: { open: "10:00", close: "21:00", closed: false },
};

export default function Settings() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const branchId = user?.branchId ?? "";
  const [activeTab, setActiveTab] = useState("store");

  const [storeSettings, setStoreSettings] = useState({
    name: "",
    address: "",
    phone: "",
    email: "",
    website: "",
    currency: "INR",
    timezone: "Asia/Kolkata",
    taxRate: 8.5,
    serviceCharge: 10,
    openingHours: defaultOpeningHours,
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

  // Bill printer connects to a local print-bridge (e.g. printer-service)
  // running near the till. Persisted via the /printers API, and - once
  // saved - used automatically for every future receipt print (see
  // OrderPanel's auto-print-on-payment and "Print Bill" button).
  const [billPrinter, setBillPrinter] = useState({
    printer_url: "",
    printer_token: "",
    printer_name: "",
    printer_type: "ESCPOS", // Only supported type right now.
  });
  const [availablePrinters, setAvailablePrinters] = useState<string[]>([]);
  const [detectingPrinters, setDetectingPrinters] = useState(false);
  const [testingPrint, setTestingPrint] = useState(false);

  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    orderNotifications: true,
    lowStockAlerts: true,
    staffAttendance: false,
    dailyReports: true,
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
  });

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ["restaurant", branchId],
    queryFn: () => getRestaurantById(branchId),
    enabled: !!branchId,
    select: (r: any) => r?.data ?? r,
  });

  useEffect(() => {
    if (restaurant) {
      setStoreSettings((prev) => ({
        ...prev,
        name: restaurant.name || "",
        address: restaurant.address || "",
        phone: restaurant.phone || "",
        email: restaurant.email || "",
        website: restaurant.website_url || "",
      }));
    }
  }, [restaurant]);

  // Loaded via the "active" endpoint (not the masked list) since editing the
  // form needs the real printer_token, not just a has_token flag.
  const { data: activeBillPrinter } = useQuery({
    queryKey: ["printers", branchId, "active", "bill"],
    queryFn: () => getActivePrinter(branchId, "bill"),
    enabled: !!branchId,
    retry: false,
    select: (r: any) => (r?.data ?? r) as ReceiptPrinterActiveConfig,
  });

  useEffect(() => {
    if (activeBillPrinter) {
      setBillPrinter({
        printer_url: activeBillPrinter.printer_url,
        printer_token: activeBillPrinter.printer_token,
        printer_name: activeBillPrinter.printer_name,
        printer_type: activeBillPrinter.printer_type || "ESCPOS",
      });
      setPrinterSettings((prev) => ({
        ...prev,
        billPrinter: activeBillPrinter.printer_name,
        autoPrintBill: activeBillPrinter.auto_print,
      }));
    }
  }, [activeBillPrinter]);

  // On-screen sample of the exact 42-char column layout the ESC/POS bridge
  // prints (receipt_printer.py's generate_receipt_escpos), so alignment can
  // be checked without a physical test print.
  const sampleReceiptText = useMemo(
    () =>
      buildSampleReceipt({
        name: storeSettings.name,
        address: storeSettings.address,
        phone: storeSettings.phone,
        gstin: restaurant?.gstin,
      }),
    [storeSettings.name, storeSettings.address, storeSettings.phone, restaurant?.gstin],
  );

  const updateMutation = useMutation({
    mutationFn: (data: any) => updateRestaurant(branchId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["restaurant", branchId] });
      addToast({ type: "success", title: "Store settings saved successfully" });
    },
    onError: (e: any) => addToast({ type: "error", title: e?.message ?? "Failed to save settings" }),
  });

  const savePrinterMutation = useMutation({
    mutationFn: () =>
      saveReceiptPrinter({
        restaurant_id: branchId,
        purpose: "bill",
        printer_name: billPrinter.printer_name,
        printer_url: billPrinter.printer_url,
        printer_token: billPrinter.printer_token,
        printer_type: billPrinter.printer_type,
        data_format: "escpos",
        // Once saved, this printer is used automatically for every future
        // receipt (see OrderPanel's payment-success auto-print).
        auto_print: true,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["printers", branchId] });
      addToast({ type: "success", title: "Bill printer settings saved" });
    },
    onError: (e: any) => addToast({ type: "error", title: e?.message ?? "Failed to save printer settings" }),
  });

  const handleDetectPrinters = async () => {
    if (!billPrinter.printer_url || !billPrinter.printer_token) {
      addToast({ type: "error", title: "Enter the print-bridge URL and token first" });
      return;
    }
    setDetectingPrinters(true);
    try {
      const names = await fetchBridgePrinters(billPrinter.printer_url, billPrinter.printer_token);
      setAvailablePrinters(names);
      if (names.length === 0) {
        addToast({ type: "info", title: "No printers found on the bridge" });
      } else {
        addToast({ type: "success", title: `Found ${names.length} printer(s)` });
      }
    } catch (e: any) {
      addToast({ type: "error", title: e?.message ?? "Could not reach the print-bridge" });
    } finally {
      setDetectingPrinters(false);
    }
  };

  const handleTestPrint = async () => {
    if (!billPrinter.printer_url || !billPrinter.printer_token || !billPrinter.printer_name) {
      addToast({ type: "error", title: "Fill in URL, token, and printer name first" });
      return;
    }
    setTestingPrint(true);
    try {
      await sendTestPrint(billPrinter);
      addToast({ type: "success", title: "Test ticket sent" });
    } catch (e: any) {
      addToast({ type: "error", title: e?.message ?? "Test print failed" });
    } finally {
      setTestingPrint(false);
    }
  };

  const handleSaveBillPrinter = () => {
    if (!billPrinter.printer_name || !billPrinter.printer_url || !billPrinter.printer_token) {
      addToast({ type: "error", title: "Printer name, URL, and token are required" });
      return;
    }
    savePrinterMutation.mutate();
  };

  const handleSaveStore = () => {
    updateMutation.mutate({
      name: storeSettings.name,
      address: storeSettings.address,
      phone: storeSettings.phone,
      email: storeSettings.email,
      website_url: storeSettings.website,
    });
  };

  const handleSaveSettings = (category: string) => {
    addToast({ type: "success", title: `${category} settings saved (local only)` });
  };

  const handleBackup = () => {
    addToast({ type: "info", title: "Backup initiated" });
  };

  const handleRestore = () => {
    addToast({ type: "info", title: "Restore initiated" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-foreground-muted mt-1">System configuration and preferences</p>
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
          <TabsTrigger value="store" className="data-[state=active]:bg-pos-accent data-[state=active]:text-foreground">
            <Building className="mr-2 h-4 w-4" />
            Store
          </TabsTrigger>
          <TabsTrigger value="payments" className="data-[state=active]:bg-pos-accent data-[state=active]:text-foreground">
            <CreditCard className="mr-2 h-4 w-4" />
            Payments
          </TabsTrigger>
          <TabsTrigger value="printers" className="data-[state=active]:bg-pos-accent data-[state=active]:text-foreground">
            <Printer className="mr-2 h-4 w-4" />
            Printers
          </TabsTrigger>
          <TabsTrigger value="notifications" className="data-[state=active]:bg-pos-accent data-[state=active]:text-foreground">
            <Bell className="mr-2 h-4 w-4" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="data-[state=active]:bg-pos-accent data-[state=active]:text-foreground">
            <Shield className="mr-2 h-4 w-4" />
            Security
          </TabsTrigger>
          <TabsTrigger value="system" className="data-[state=active]:bg-pos-accent data-[state=active]:text-foreground">
            <Database className="mr-2 h-4 w-4" />
            System
          </TabsTrigger>
        </TabsList>

        {/* Store Settings Tab */}
        <TabsContent value="store" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Store Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {isLoading ? (
                  <div className="text-muted-foreground text-sm">Loading store info...</div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="storeName" className="text-foreground">Store Name</Label>
                      <Input
                        id="storeName"
                        value={storeSettings.name}
                        onChange={(e) => setStoreSettings({ ...storeSettings, name: e.target.value })}
                        className="bg-card border-border text-foreground"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="address" className="text-foreground">Address</Label>
                      <Textarea
                        id="address"
                        value={storeSettings.address}
                        onChange={(e) => setStoreSettings({ ...storeSettings, address: e.target.value })}
                        className="bg-card border-border text-foreground"
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="phone" className="text-foreground">Phone</Label>
                        <Input
                          id="phone"
                          value={storeSettings.phone}
                          onChange={(e) => setStoreSettings({ ...storeSettings, phone: e.target.value })}
                          className="bg-card border-border text-foreground"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-foreground">Email</Label>
                        <Input
                          id="email"
                          type="email"
                          value={storeSettings.email}
                          onChange={(e) => setStoreSettings({ ...storeSettings, email: e.target.value })}
                          className="bg-card border-border text-foreground"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="website" className="text-foreground">Website</Label>
                      <Input
                        id="website"
                        value={storeSettings.website}
                        onChange={(e) => setStoreSettings({ ...storeSettings, website: e.target.value })}
                        className="bg-card border-border text-foreground"
                        placeholder="https://yourrestaurant.com"
                      />
                    </div>
                  </>
                )}
                <Button
                  onClick={handleSaveStore}
                  disabled={updateMutation.isPending || isLoading}
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Save className="mr-2 h-4 w-4" />
                  {updateMutation.isPending ? "Saving..." : "Save Store Settings"}
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Regional Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currency" className="text-foreground">Currency</Label>
                  <Select
                    value={storeSettings.currency}
                    onValueChange={(value) => setStoreSettings({ ...storeSettings, currency: value })}
                  >
                    <SelectTrigger className="bg-card border-border text-foreground">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      <SelectItem value="INR">INR - Indian Rupee (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone" className="text-foreground">Timezone</Label>
                  <Input
                    id="timezone"
                    readOnly
                    disabled
                    value="India Standard Time (IST) — Asia/Kolkata"
                    className="bg-muted border-border text-foreground"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="taxRate" className="text-foreground">Tax Rate (%)</Label>
                    <Input
                      id="taxRate"
                      type="number"
                      step="0.1"
                      value={storeSettings.taxRate}
                      onChange={(e) => setStoreSettings({ ...storeSettings, taxRate: parseFloat(e.target.value) || 0 })}
                      className="bg-card border-border text-foreground"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="serviceCharge" className="text-foreground">Service Charge (%)</Label>
                    <Input
                      id="serviceCharge"
                      type="number"
                      step="0.1"
                      value={storeSettings.serviceCharge}
                      onChange={(e) => setStoreSettings({ ...storeSettings, serviceCharge: parseFloat(e.target.value) || 0 })}
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
                {Object.entries(storeSettings.openingHours).map(([day, hours]) => (
                  <div key={day} className="flex flex-wrap items-center justify-between gap-3 p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-20 shrink-0">
                        <span className="font-medium text-foreground">{day}</span>
                      </div>
                      <Switch
                        checked={!hours.closed}
                        onCheckedChange={(checked) => {
                          setStoreSettings({
                            ...storeSettings,
                            openingHours: { ...storeSettings.openingHours, [day]: { ...hours, closed: !checked } },
                          });
                        }}
                      />
                      <span className="text-foreground-muted text-sm">{hours.closed ? "Closed" : "Open"}</span>
                    </div>
                    {!hours.closed && (
                      <div className="flex items-center gap-2">
                        <Input
                          type="time"
                          value={hours.open}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              openingHours: { ...storeSettings.openingHours, [day]: { ...hours, open: e.target.value } },
                            });
                          }}
                          className="w-auto bg-card border-border text-foreground"
                        />
                        <span className="flex h-10 items-center text-sm text-foreground-muted">to</span>
                        <Input
                          type="time"
                          value={hours.close}
                          onChange={(e) => {
                            setStoreSettings({
                              ...storeSettings,
                              openingHours: { ...storeSettings.openingHours, [day]: { ...hours, close: e.target.value } },
                            });
                          }}
                          className="w-auto bg-card border-border text-foreground"
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payment Settings Tab */}
        <TabsContent value="payments" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Payment Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "cashEnabled", label: "Cash Payments", icon: IndianRupee },
                  { key: "cardEnabled", label: "Card Payments", icon: CreditCard },
                  { key: "upiEnabled", label: "UPI Payments", icon: Globe },
                  { key: "walletEnabled", label: "Digital Wallet", icon: CreditCard },
                ].map(({ key, label, icon: Icon }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Icon className="h-5 w-5 text-pos-accent" />
                      <span className="text-foreground">{label}</span>
                    </div>
                    <Switch
                      checked={paymentSettings[key as keyof PaymentSettings] as boolean}
                      onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, [key]: checked })}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Payment Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-foreground">Split Payments</span>
                  <Switch
                    checked={paymentSettings.splitPaymentEnabled}
                    onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, splitPaymentEnabled: checked })}
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-foreground">Tips Enabled</span>
                  <Switch
                    checked={paymentSettings.tipEnabled}
                    onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, tipEnabled: checked })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">Default Tip (%)</Label>
                  <Input
                    type="number"
                    value={paymentSettings.defaultTipPercentage}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, defaultTipPercentage: parseInt(e.target.value) || 0 })}
                    className="bg-card border-border text-foreground"
                  />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-foreground">Auto Settlement</span>
                  <Switch
                    checked={paymentSettings.autoSettlement}
                    onCheckedChange={(checked) => setPaymentSettings({ ...paymentSettings, autoSettlement: checked })}
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
              <CardTitle className="text-foreground">KOT Printer</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 max-w-sm">
                <Label className="text-foreground">KOT Printer</Label>
                <Select value={printerSettings.kotPrinter}>
                  <SelectTrigger className="bg-card border-border text-foreground">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card border-border">
                    <SelectItem value="Kitchen Printer 1">Kitchen Printer 1</SelectItem>
                    <SelectItem value="Kitchen Printer 2">Kitchen Printer 2</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">Bill Printer</CardTitle>
              <p className="text-sm text-foreground-muted">
                Connects directly from this browser to your local print-bridge (e.g. printer-service
                running near the till). Once saved, it is used automatically to print every bill.
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Printer Local URL</Label>
                  <Input
                    className="bg-card border-border text-foreground"
                    placeholder="http://127.0.0.1:9100"
                    value={billPrinter.printer_url}
                    onChange={(e) => setBillPrinter({ ...billPrinter, printer_url: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-foreground">x-print-token</Label>
                  <Input
                    type="password"
                    className="bg-card border-border text-foreground"
                    placeholder="x-print-token value"
                    value={billPrinter.printer_token}
                    onChange={(e) => setBillPrinter({ ...billPrinter, printer_token: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-foreground">Printer Name</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="border-pos-secondary"
                    disabled={detectingPrinters}
                    onClick={handleDetectPrinters}
                  >
                    <RefreshCw className={`mr-2 h-3 w-3 ${detectingPrinters ? "animate-spin" : ""}`} />
                    {detectingPrinters ? "Detecting..." : "Detect Printers"}
                  </Button>
                </div>
                {availablePrinters.length > 0 ? (
                  <Select
                    value={billPrinter.printer_name}
                    onValueChange={(value) => setBillPrinter({ ...billPrinter, printer_name: value })}
                  >
                    <SelectTrigger className="bg-card border-border text-foreground">
                      <SelectValue placeholder="Choose a detected printer" />
                    </SelectTrigger>
                    <SelectContent className="bg-card border-border">
                      {availablePrinters.map((name) => (
                        <SelectItem key={name} value={name}>
                          {name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    className="bg-card border-border text-foreground"
                    placeholder="Enter URL + token, then Detect Printers"
                    value={billPrinter.printer_name}
                    onChange={(e) => setBillPrinter({ ...billPrinter, printer_name: e.target.value })}
                  />
                )}
              </div>

              <div className="space-y-2 max-w-xs">
                <Label className="text-foreground">Printer Type</Label>
                <Input
                  disabled
                  className="bg-muted border-border text-foreground-muted"
                  value="ESC/POS"
                />
                <p className="text-xs text-foreground-muted">Only ESC/POS receipt printers are supported right now.</p>
              </div>

              <Separator className="bg-muted" />

              <div className="space-y-2">
                <Label className="text-foreground">Sample Receipt Preview (78mm)</Label>
                <p className="text-sm text-foreground-muted">
                  Exact column layout the printer will use ({RECEIPT_LINE_WIDTH} characters wide) - check
                  alignment here before sending a physical test print.
                </p>
                <div className="flex justify-center bg-muted rounded-lg p-4 overflow-x-auto">
                  <pre
                    className="bg-white text-black text-xs leading-tight p-3 shadow-md"
                    style={{ width: `${RECEIPT_LINE_WIDTH}ch`, fontFamily: "'Courier New', monospace" }}
                  >
                    {sampleReceiptText}
                  </pre>
                </div>
              </div>

              <Separator className="bg-muted" />

              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  onClick={handleSaveBillPrinter}
                  disabled={savePrinterMutation.isPending}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Save className="mr-2 h-4 w-4" />
                  Save Printer Settings
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 border-pos-secondary"
                  disabled={testingPrint}
                  onClick={handleTestPrint}
                >
                  <Printer className="mr-2 h-4 w-4" />
                  {testingPrint ? "Sending..." : "Send Test Print"}
                </Button>
              </div>
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
                  <div key={key} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-foreground">{label}</span>
                    <Switch
                      checked={notificationSettings[key as keyof NotificationSettings] as boolean}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, [key]: checked })}
                    />
                  </div>
                ))}
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Delivery Channels</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { key: "emailNotifications", label: "Email Notifications" },
                  { key: "smsNotifications", label: "SMS Notifications" },
                  { key: "pushNotifications", label: "Push Notifications" },
                ].map(({ key, label }) => (
                  <div key={key} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                    <span className="text-foreground">{label}</span>
                    <Switch
                      checked={notificationSettings[key as keyof NotificationSettings] as boolean}
                      onCheckedChange={(checked) => setNotificationSettings({ ...notificationSettings, [key]: checked })}
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
                <CardTitle className="text-foreground">Password Policy</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-foreground text-sm">Minimum 8 characters</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-foreground text-sm">Require uppercase letters</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-foreground text-sm">Require numbers</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-foreground text-sm">Password expiry: 90 days</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Session Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-foreground">Auto-logout after (minutes)</Label>
                  <Input type="number" defaultValue="30" className="bg-card border-border text-foreground" />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-foreground">Require 2FA</span>
                  <Switch />
                </div>
                <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-foreground">Login Notifications</span>
                  <Switch defaultChecked />
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
                <CardTitle className="text-foreground">Backup & Maintenance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">Last Backup</span>
                    <span className="text-foreground-muted text-sm">2 hours ago</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-foreground">System Version</span>
                    <span className="text-foreground-muted text-sm">v2.1.0</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full border-pos-secondary text-foreground-muted hover:text-foreground"
                    onClick={handleBackup}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Create Backup
                  </Button>
                  <Button variant="outline" className="w-full border-pos-secondary text-foreground-muted hover:text-foreground">
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

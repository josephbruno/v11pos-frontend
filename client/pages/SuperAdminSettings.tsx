import { useState } from "react";
import { motion } from "framer-motion";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Settings,
  Save,
  RefreshCw,
  Globe,
  Database,
  Mail,
  Bell,
  Shield,
  Clock,
  Zap,
  HardDrive,
  Network,
  Users,
  Key,
  AlertTriangle,
  CheckCircle2,
  Download,
  Upload,
  Trash2,
  Edit,
  Plus,
} from "lucide-react";

// Mock global settings data
const systemSettings = {
  general: {
    systemName: "RestaurantPOS Global System",
    systemVersion: "v2.1.3",
    defaultTimezone: "UTC",
    defaultLanguage: "en-US",
    defaultCurrency: "USD",
    maintenanceMode: false,
    debugMode: false,
    systemDescription: "Global restaurant management platform",
  },
  performance: {
    maxConcurrentUsers: 10000,
    apiRateLimit: 1000,
    cacheTimeout: 3600,
    sessionTimeout: 1800,
    maxFileUploadSize: 50,
    databaseConnectionPool: 100,
    enableCaching: true,
    enableCompression: true,
  },
  security: {
    enforceHttps: true,
    enableTwoFactor: true,
    passwordMinLength: 12,
    sessionEncryption: true,
    auditLogging: true,
    ipWhitelisting: false,
    bruteForceProtection: true,
    dataRetentionDays: 2555,
  },
  notifications: {
    emailEnabled: true,
    smsEnabled: true,
    pushEnabled: true,
    webhookEnabled: true,
    adminAlerts: true,
    systemAlerts: true,
    securityAlerts: true,
    performanceAlerts: true,
  },
  integrations: {
    stripeEnabled: true,
    twilioEnabled: true,
    sendgridEnabled: true,
    googleAnalyticsEnabled: true,
    slackEnabled: false,
    teamsEnabled: false,
  },
  backup: {
    autoBackupEnabled: true,
    backupFrequency: "daily",
    retentionPeriod: 30,
    encryptBackups: true,
    cloudBackupEnabled: true,
    compressionEnabled: true,
  },
};

const timezones = [
  { value: "UTC", label: "UTC (Coordinated Universal Time)" },
  { value: "America/New_York", label: "Eastern Time (New York)" },
  { value: "America/Los_Angeles", label: "Pacific Time (Los Angeles)" },
  { value: "Europe/London", label: "Greenwich Mean Time (London)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (Tokyo)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (Sydney)" },
];

const languages = [
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "es-ES", label: "Spanish" },
  { value: "fr-FR", label: "French" },
  { value: "de-DE", label: "German" },
  { value: "ja-JP", label: "Japanese" },
  { value: "zh-CN", label: "Chinese (Simplified)" },
];

const currencies = [
  { value: "USD", label: "US Dollar ($)" },
  { value: "EUR", label: "Euro (€)" },
  { value: "GBP", label: "British Pound (£)" },
  { value: "JPY", label: "Japanese Yen (¥)" },
  { value: "CAD", label: "Canadian Dollar (C$)" },
  { value: "AUD", label: "Australian Dollar (A$)" },
  { value: "INR", label: "Indian Rupee (₹)" },
];

export default function SuperAdminSettings() {
  const [settings, setSettings] = useState(systemSettings);
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const updateSetting = (section: string, key: string, value: any) => {
    setSettings((prev) => ({
      ...prev,
      [section]: {
        ...prev[section as keyof typeof prev],
        [key]: value,
      },
    }));
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = () => {
    console.log("Saving global settings:", settings);
    setHasUnsavedChanges(false);
  };

  const handleResetSettings = () => {
    setSettings(systemSettings);
    setHasUnsavedChanges(false);
  };

  const handleBackupNow = () => {
    console.log("Creating system backup...");
    setIsBackupDialogOpen(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Global System Settings
          </h1>
          <p className="text-muted-foreground">
            Configure system-wide parameters and operational settings
          </p>
        </div>
        <div className="flex items-center space-x-2">
          {hasUnsavedChanges && (
            <Badge
              variant="secondary"
              className="bg-yellow-100 text-yellow-800"
            >
              <AlertTriangle className="h-3 w-3 mr-1" />
              Unsaved Changes
            </Badge>
          )}
          <Button variant="outline" onClick={handleResetSettings}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Reset
          </Button>
          <Dialog
            open={isBackupDialogOpen}
            onOpenChange={setIsBackupDialogOpen}
          >
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Backup
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create System Backup</DialogTitle>
                <DialogDescription>
                  This will create a complete backup of all system data and
                  configurations.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Database backup</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">Configuration files</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">User uploaded files</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm">System logs</span>
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsBackupDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleBackupNow}>
                  <Download className="h-4 w-4 mr-2" />
                  Create Backup
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            onClick={handleSaveSettings}
            disabled={!hasUnsavedChanges}
            className="bg-primary hover:bg-primary/90"
          >
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-muted-foreground">System Status</p>
                <p className="text-lg font-bold">Operational</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-muted-foreground">Database</p>
                <p className="text-lg font-bold">Healthy</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <HardDrive className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-muted-foreground">Storage</p>
                <p className="text-lg font-bold">78% Used</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-muted-foreground">Performance</p>
                <p className="text-lg font-bold">Optimal</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="backup">Backup & Restore</TabsTrigger>
        </TabsList>

        {/* General Settings */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Globe className="h-5 w-5 mr-2" />
                General Configuration
              </CardTitle>
              <CardDescription>
                Basic system settings and global defaults
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="system-name">System Name</Label>
                  <Input
                    id="system-name"
                    value={settings.general.systemName}
                    onChange={(e) =>
                      updateSetting("general", "systemName", e.target.value)
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="system-version">System Version</Label>
                  <Input
                    id="system-version"
                    value={settings.general.systemVersion}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div>
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <Select
                    value={settings.general.defaultTimezone}
                    onValueChange={(value) =>
                      updateSetting("general", "defaultTimezone", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {timezones.map((tz) => (
                        <SelectItem key={tz.value} value={tz.value}>
                          {tz.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="language">Default Language</Label>
                  <Select
                    value={settings.general.defaultLanguage}
                    onValueChange={(value) =>
                      updateSetting("general", "defaultLanguage", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currency">Default Currency</Label>
                  <Select
                    value={settings.general.defaultCurrency}
                    onValueChange={(value) =>
                      updateSetting("general", "defaultCurrency", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currencies.map((curr) => (
                        <SelectItem key={curr.value} value={curr.value}>
                          {curr.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="description">System Description</Label>
                <Textarea
                  id="description"
                  value={settings.general.systemDescription}
                  onChange={(e) =>
                    updateSetting(
                      "general",
                      "systemDescription",
                      e.target.value,
                    )
                  }
                  rows={3}
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Maintenance Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable to restrict system access for maintenance
                  </p>
                </div>
                <Switch
                  checked={settings.general.maintenanceMode}
                  onCheckedChange={(checked) =>
                    updateSetting("general", "maintenanceMode", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Debug Mode</Label>
                  <p className="text-sm text-muted-foreground">
                    Enable detailed logging for troubleshooting
                  </p>
                </div>
                <Switch
                  checked={settings.general.debugMode}
                  onCheckedChange={(checked) =>
                    updateSetting("general", "debugMode", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Performance Settings */}
        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Zap className="h-5 w-5 mr-2" />
                Performance Configuration
              </CardTitle>
              <CardDescription>
                System performance and resource management settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="max-users">Max Concurrent Users</Label>
                  <Input
                    id="max-users"
                    type="number"
                    value={settings.performance.maxConcurrentUsers}
                    onChange={(e) =>
                      updateSetting(
                        "performance",
                        "maxConcurrentUsers",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="api-rate">
                    API Rate Limit (requests/min)
                  </Label>
                  <Input
                    id="api-rate"
                    type="number"
                    value={settings.performance.apiRateLimit}
                    onChange={(e) =>
                      updateSetting(
                        "performance",
                        "apiRateLimit",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="cache-timeout">Cache Timeout (seconds)</Label>
                  <Input
                    id="cache-timeout"
                    type="number"
                    value={settings.performance.cacheTimeout}
                    onChange={(e) =>
                      updateSetting(
                        "performance",
                        "cacheTimeout",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="session-timeout">
                    Session Timeout (seconds)
                  </Label>
                  <Input
                    id="session-timeout"
                    type="number"
                    value={settings.performance.sessionTimeout}
                    onChange={(e) =>
                      updateSetting(
                        "performance",
                        "sessionTimeout",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="upload-size">Max File Upload Size (MB)</Label>
                  <div className="space-y-2">
                    <Slider
                      value={[settings.performance.maxFileUploadSize]}
                      onValueChange={(value) =>
                        updateSetting(
                          "performance",
                          "maxFileUploadSize",
                          value[0],
                        )
                      }
                      max={500}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                    <div className="text-sm text-muted-foreground">
                      {settings.performance.maxFileUploadSize} MB
                    </div>
                  </div>
                </div>
                <div>
                  <Label htmlFor="db-pool">Database Connection Pool</Label>
                  <Input
                    id="db-pool"
                    type="number"
                    value={settings.performance.databaseConnectionPool}
                    onChange={(e) =>
                      updateSetting(
                        "performance",
                        "databaseConnectionPool",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Caching</Label>
                  <p className="text-sm text-muted-foreground">
                    Improve performance with intelligent caching
                  </p>
                </div>
                <Switch
                  checked={settings.performance.enableCaching}
                  onCheckedChange={(checked) =>
                    updateSetting("performance", "enableCaching", checked)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label>Enable Compression</Label>
                  <p className="text-sm text-muted-foreground">
                    Compress responses to reduce bandwidth usage
                  </p>
                </div>
                <Switch
                  checked={settings.performance.enableCompression}
                  onCheckedChange={(checked) =>
                    updateSetting("performance", "enableCompression", checked)
                  }
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Shield className="h-5 w-5 mr-2" />
                Security Configuration
              </CardTitle>
              <CardDescription>
                System security policies and protection settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="password-length">
                    Minimum Password Length
                  </Label>
                  <Input
                    id="password-length"
                    type="number"
                    value={settings.security.passwordMinLength}
                    onChange={(e) =>
                      updateSetting(
                        "security",
                        "passwordMinLength",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="retention-days">Data Retention (days)</Label>
                  <Input
                    id="retention-days"
                    type="number"
                    value={settings.security.dataRetentionDays}
                    onChange={(e) =>
                      updateSetting(
                        "security",
                        "dataRetentionDays",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enforce HTTPS</Label>
                    <p className="text-sm text-muted-foreground">
                      Redirect all HTTP traffic to HTTPS
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.enforceHttps}
                    onCheckedChange={(checked) =>
                      updateSetting("security", "enforceHttps", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">
                      Require 2FA for admin access
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.enableTwoFactor}
                    onCheckedChange={(checked) =>
                      updateSetting("security", "enableTwoFactor", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Session Encryption</Label>
                    <p className="text-sm text-muted-foreground">
                      Encrypt user session data
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.sessionEncryption}
                    onCheckedChange={(checked) =>
                      updateSetting("security", "sessionEncryption", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">
                      Log all system activities for compliance
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.auditLogging}
                    onCheckedChange={(checked) =>
                      updateSetting("security", "auditLogging", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>IP Whitelisting</Label>
                    <p className="text-sm text-muted-foreground">
                      Restrict access to approved IP addresses
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.ipWhitelisting}
                    onCheckedChange={(checked) =>
                      updateSetting("security", "ipWhitelisting", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Brute Force Protection</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically block suspicious login attempts
                    </p>
                  </div>
                  <Switch
                    checked={settings.security.bruteForceProtection}
                    onCheckedChange={(checked) =>
                      updateSetting("security", "bruteForceProtection", checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Bell className="h-5 w-5 mr-2" />
                Notification Configuration
              </CardTitle>
              <CardDescription>
                Configure system-wide notification channels and preferences
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via email
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.emailEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "emailEnabled", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications via SMS
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.smsEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "smsEnabled", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Push Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send browser push notifications
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.pushEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "pushEnabled", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Webhook Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Send notifications to external systems
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.webhookEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "webhookEnabled", checked)
                    }
                  />
                </div>
                <hr className="my-6" />
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Admin Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Administrative notifications and updates
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.adminAlerts}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "adminAlerts", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>System Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      System performance and health alerts
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.systemAlerts}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "systemAlerts", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Security incidents and threats
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.securityAlerts}
                    onCheckedChange={(checked) =>
                      updateSetting("notifications", "securityAlerts", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Performance Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Performance degradation warnings
                    </p>
                  </div>
                  <Switch
                    checked={settings.notifications.performanceAlerts}
                    onCheckedChange={(checked) =>
                      updateSetting(
                        "notifications",
                        "performanceAlerts",
                        checked,
                      )
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations Settings */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Network className="h-5 w-5 mr-2" />
                Integration Configuration
              </CardTitle>
              <CardDescription>
                Enable and configure third-party service integrations
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Stripe Payments</Label>
                    <p className="text-sm text-muted-foreground">
                      Payment processing integration
                    </p>
                  </div>
                  <Switch
                    checked={settings.integrations.stripeEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("integrations", "stripeEnabled", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Twilio SMS</Label>
                    <p className="text-sm text-muted-foreground">
                      SMS notification service
                    </p>
                  </div>
                  <Switch
                    checked={settings.integrations.twilioEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("integrations", "twilioEnabled", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>SendGrid Email</Label>
                    <p className="text-sm text-muted-foreground">
                      Email delivery service
                    </p>
                  </div>
                  <Switch
                    checked={settings.integrations.sendgridEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("integrations", "sendgridEnabled", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Google Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Web analytics and tracking
                    </p>
                  </div>
                  <Switch
                    checked={settings.integrations.googleAnalyticsEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting(
                        "integrations",
                        "googleAnalyticsEnabled",
                        checked,
                      )
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Slack Integration</Label>
                    <p className="text-sm text-muted-foreground">
                      Team communication and alerts
                    </p>
                  </div>
                  <Switch
                    checked={settings.integrations.slackEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("integrations", "slackEnabled", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Microsoft Teams</Label>
                    <p className="text-sm text-muted-foreground">
                      Enterprise communication platform
                    </p>
                  </div>
                  <Switch
                    checked={settings.integrations.teamsEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("integrations", "teamsEnabled", checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Backup Settings */}
        <TabsContent value="backup" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <HardDrive className="h-5 w-5 mr-2" />
                Backup & Restore Configuration
              </CardTitle>
              <CardDescription>
                Data protection and disaster recovery settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <Label htmlFor="backup-frequency">Backup Frequency</Label>
                  <Select
                    value={settings.backup.backupFrequency}
                    onValueChange={(value) =>
                      updateSetting("backup", "backupFrequency", value)
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="hourly">Hourly</SelectItem>
                      <SelectItem value="daily">Daily</SelectItem>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="retention-period">
                    Retention Period (days)
                  </Label>
                  <Input
                    id="retention-period"
                    type="number"
                    value={settings.backup.retentionPeriod}
                    onChange={(e) =>
                      updateSetting(
                        "backup",
                        "retentionPeriod",
                        parseInt(e.target.value),
                      )
                    }
                  />
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Auto Backup</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically backup system data
                    </p>
                  </div>
                  <Switch
                    checked={settings.backup.autoBackupEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("backup", "autoBackupEnabled", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Encrypt Backups</Label>
                    <p className="text-sm text-muted-foreground">
                      Encrypt backup files for security
                    </p>
                  </div>
                  <Switch
                    checked={settings.backup.encryptBackups}
                    onCheckedChange={(checked) =>
                      updateSetting("backup", "encryptBackups", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Cloud Backup</Label>
                    <p className="text-sm text-muted-foreground">
                      Store backups in cloud storage
                    </p>
                  </div>
                  <Switch
                    checked={settings.backup.cloudBackupEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("backup", "cloudBackupEnabled", checked)
                    }
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Compression</Label>
                    <p className="text-sm text-muted-foreground">
                      Compress backups to save storage space
                    </p>
                  </div>
                  <Switch
                    checked={settings.backup.compressionEnabled}
                    onCheckedChange={(checked) =>
                      updateSetting("backup", "compressionEnabled", checked)
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

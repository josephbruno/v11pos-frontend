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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import {
  Network as NetworkIcon,
  Plus,
  Globe,
  Zap,
  Shield,
  Activity,
  Settings,
  Eye,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Server,
  Database,
  Cloud,
  Webhook,
  Key,
  Lock,
  Wifi,
  Router,
} from "lucide-react";

// Mock network and API data
const apiEndpoints = [
  {
    id: "api-001",
    name: "Main POS API",
    url: "https://api.restaurantpos.com/v1",
    status: "active",
    responseTime: 125,
    uptime: 99.9,
    requests: 24530,
    errors: 12,
    lastCheck: "2024-01-15 16:45",
    version: "v1.2.3",
    rateLimit: 1000,
  },
  {
    id: "api-002",
    name: "Analytics API",
    url: "https://analytics.restaurantpos.com/v2",
    status: "active",
    responseTime: 89,
    uptime: 99.8,
    requests: 15420,
    errors: 5,
    lastCheck: "2024-01-15 16:44",
    version: "v2.1.0",
    rateLimit: 500,
  },
  {
    id: "api-003",
    name: "Payment Gateway",
    url: "https://payments.gateway.com/api",
    status: "warning",
    responseTime: 340,
    uptime: 98.5,
    requests: 8920,
    errors: 134,
    lastCheck: "2024-01-15 16:43",
    version: "v1.0.8",
    rateLimit: 200,
  },
  {
    id: "api-004",
    name: "Inventory Sync",
    url: "https://inventory.sync.com/v1",
    status: "error",
    responseTime: 0,
    uptime: 45.2,
    requests: 0,
    errors: 892,
    lastCheck: "2024-01-15 16:30",
    version: "v1.1.2",
    rateLimit: 100,
  },
];

const integrations = [
  {
    id: "int-001",
    name: "Stripe Payment",
    type: "payment",
    status: "connected",
    provider: "Stripe",
    usage: 89,
    lastSync: "2024-01-15 16:40",
    organizations: 28,
  },
  {
    id: "int-002",
    name: "Razorpay Gateway",
    type: "payment",
    status: "connected",
    provider: "Razorpay",
    usage: 67,
    lastSync: "2024-01-15 16:35",
    organizations: 18,
  },
  {
    id: "int-003",
    name: "SendGrid Email",
    type: "communication",
    status: "connected",
    provider: "SendGrid",
    usage: 94,
    lastSync: "2024-01-15 16:42",
    organizations: 31,
  },
  {
    id: "int-004",
    name: "Twilio SMS",
    type: "communication",
    status: "disconnected",
    provider: "Twilio",
    usage: 23,
    lastSync: "2024-01-14 10:20",
    organizations: 8,
  },
  {
    id: "int-005",
    name: "Google Analytics",
    type: "analytics",
    status: "connected",
    provider: "Google",
    usage: 76,
    lastSync: "2024-01-15 16:38",
    organizations: 22,
  },
];

const webhooks = [
  {
    id: "wh-001",
    name: "Order Created",
    url: "https://external.system.com/orders/webhook",
    events: ["order.created", "order.updated"],
    status: "active",
    deliveryRate: 98.5,
    failures: 12,
    lastDelivery: "2024-01-15 16:42",
  },
  {
    id: "wh-002",
    name: "Payment Processed",
    url: "https://accounting.system.com/webhook",
    events: ["payment.success", "payment.failed"],
    status: "active",
    deliveryRate: 100,
    failures: 0,
    lastDelivery: "2024-01-15 16:45",
  },
  {
    id: "wh-003",
    name: "Inventory Updated",
    url: "https://warehouse.system.com/inventory",
    events: ["inventory.low", "inventory.updated"],
    status: "paused",
    deliveryRate: 87.3,
    failures: 45,
    lastDelivery: "2024-01-15 14:30",
  },
];

const statusColors = {
  active: "bg-green-500",
  warning: "bg-yellow-500",
  error: "bg-red-500",
  connected: "bg-green-500",
  disconnected: "bg-gray-500",
  paused: "bg-yellow-500",
};

const typeIcons = {
  payment: Key,
  communication: Globe,
  analytics: Activity,
  storage: Database,
  webhook: Webhook,
};

export default function Network() {
  const [isAddingAPI, setIsAddingAPI] = useState(false);
  const [isAddingIntegration, setIsAddingIntegration] = useState(false);
  const [newAPIName, setNewAPIName] = useState("");
  const [newAPIUrl, setNewAPIUrl] = useState("");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
      case "connected":
        return <CheckCircle2 className="h-4 w-4 text-green-600" />;
      case "warning":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "error":
      case "disconnected":
        return <XCircle className="h-4 w-4 text-red-600" />;
      case "paused":
        return <Clock className="h-4 w-4 text-yellow-600" />;
      default:
        return <Activity className="h-4 w-4 text-gray-600" />;
    }
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
            Network Configuration
          </h1>
          <p className="text-muted-foreground">
            Manage APIs, integrations, and network connectivity
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Health Check
          </Button>
          <Dialog open={isAddingAPI} onOpenChange={setIsAddingAPI}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                Add Endpoint
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add API Endpoint</DialogTitle>
                <DialogDescription>
                  Configure a new API endpoint for monitoring
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="api-name">API Name</Label>
                  <Input
                    id="api-name"
                    value={newAPIName}
                    onChange={(e) => setNewAPIName(e.target.value)}
                    placeholder="e.g., Customer API"
                  />
                </div>
                <div>
                  <Label htmlFor="api-url">Endpoint URL</Label>
                  <Input
                    id="api-url"
                    value={newAPIUrl}
                    onChange={(e) => setNewAPIUrl(e.target.value)}
                    placeholder="https://api.example.com/v1"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingAPI(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setIsAddingAPI(false)}>
                  Add Endpoint
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Network Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Server className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">4</p>
                <p className="text-sm text-muted-foreground">API Endpoints</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <NetworkIcon className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">5</p>
                <p className="text-sm text-muted-foreground">Integrations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Webhook className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Webhooks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">97.8%</p>
                <p className="text-sm text-muted-foreground">Avg Uptime</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="apis" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="apis">API Endpoints</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
          <TabsTrigger value="webhooks">Webhooks</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        {/* API Endpoints */}
        <TabsContent value="apis" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>API Endpoint Monitoring</CardTitle>
              <CardDescription>
                Monitor API performance, uptime, and error rates
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {apiEndpoints.map((api) => (
                  <div
                    key={api.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(api.status)}
                        <div
                          className={`w-3 h-3 rounded-full ${statusColors[api.status as keyof typeof statusColors]}`}
                        ></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{api.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {api.url}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {api.responseTime}ms response
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {api.uptime}% uptime
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {api.requests} requests
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{api.version}</Badge>
                      <Badge
                        variant={
                          api.status === "active"
                            ? "default"
                            : api.status === "warning"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {api.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Integrations */}
        <TabsContent value="integrations" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Third-Party Integrations</CardTitle>
              <CardDescription>
                Manage external service connections and data sync
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {integrations.map((integration) => {
                  const IconComponent =
                    typeIcons[integration.type as keyof typeof typeIcons] ||
                    Globe;
                  return (
                    <div
                      key={integration.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                          <IconComponent className="h-5 w-5 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold">{integration.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            {integration.provider} • {integration.organizations}{" "}
                            organizations
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <span className="text-xs text-muted-foreground">
                              Usage:
                            </span>
                            <Progress
                              value={integration.usage}
                              className="w-20 h-2"
                            />
                            <span className="text-xs text-muted-foreground">
                              {integration.usage}%
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge
                          variant={
                            integration.status === "connected"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {integration.status}
                        </Badge>
                        <Switch
                          checked={integration.status === "connected"}
                          onCheckedChange={() =>
                            console.log(`Toggle ${integration.id}`)
                          }
                        />
                        <Button variant="outline" size="sm">
                          <Settings className="h-4 w-4 mr-1" />
                          Setup
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Webhooks */}
        <TabsContent value="webhooks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Webhook Management</CardTitle>
              <CardDescription>
                Configure event-driven notifications and data sync
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {webhooks.map((webhook) => (
                  <div
                    key={webhook.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900">
                        <Webhook className="h-5 w-5 text-purple-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{webhook.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {webhook.url}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-muted-foreground">
                            {webhook.deliveryRate}% delivery rate
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {webhook.failures} failures
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {webhook.events.map((event) => (
                            <Badge
                              key={event}
                              variant="outline"
                              className="text-xs"
                            >
                              {event}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant={
                          webhook.status === "active" ? "default" : "secondary"
                        }
                      >
                        {webhook.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Test
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security */}
        <TabsContent value="security" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>API Security</CardTitle>
                <CardDescription>
                  Authentication and access control settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>SSL/TLS Encryption</span>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Key className="h-4 w-4 text-blue-600" />
                    <span>API Key Authentication</span>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Lock className="h-4 w-4 text-purple-600" />
                    <span>Rate Limiting</span>
                  </div>
                  <Badge variant="default">Configured</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Router className="h-4 w-4 text-orange-600" />
                    <span>IP Whitelisting</span>
                  </div>
                  <Badge variant="secondary">Optional</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Network Security</CardTitle>
                <CardDescription>
                  Infrastructure and connectivity security
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Shield className="h-4 w-4 text-green-600" />
                    <span>Firewall Protection</span>
                  </div>
                  <Badge variant="default">Active</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Wifi className="h-4 w-4 text-blue-600" />
                    <span>VPN Access</span>
                  </div>
                  <Badge variant="default">Configured</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    <span>DDoS Protection</span>
                  </div>
                  <Badge variant="default">Enabled</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Database className="h-4 w-4 text-purple-600" />
                    <span>Data Encryption</span>
                  </div>
                  <Badge variant="default">AES-256</Badge>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

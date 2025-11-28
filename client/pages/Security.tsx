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
import { Textarea } from "@/components/ui/textarea";
import {
  Shield,
  Plus,
  Eye,
  EyeOff,
  Lock,
  Key,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Users,
  Activity,
  Settings,
  Ban,
  Unlock,
  Fingerprint,
  Smartphone,
  Globe,
  Database,
  FileText,
  Zap,
  Router,
  Wifi,
} from "lucide-react";

// Mock security data
const securityAlerts = [
  {
    id: "alert-001",
    type: "critical",
    title: "Multiple Failed Login Attempts",
    description: "5 failed login attempts from IP 192.168.1.100",
    timestamp: "2024-01-15 16:42",
    status: "active",
    affectedUser: "admin@restaurant.com",
    severity: "high",
  },
  {
    id: "alert-002",
    type: "warning",
    title: "Unusual API Access Pattern",
    description: "API requests from new geographic location",
    timestamp: "2024-01-15 15:30",
    status: "investigating",
    affectedUser: "api-service",
    severity: "medium",
  },
  {
    id: "alert-003",
    type: "info",
    title: "Password Policy Updated",
    description: "System password requirements have been strengthened",
    timestamp: "2024-01-15 14:15",
    status: "resolved",
    affectedUser: "system",
    severity: "low",
  },
  {
    id: "alert-004",
    type: "critical",
    title: "Unauthorized Access Attempt",
    description: "Admin panel access from unrecognized device",
    timestamp: "2024-01-15 13:45",
    status: "blocked",
    affectedUser: "superadmin@restaurant.com",
    severity: "high",
  },
];

const accessPolicies = [
  {
    id: "policy-001",
    name: "Password Requirements",
    description: "Minimum 12 characters, mixed case, numbers, symbols",
    status: "active",
    appliedTo: "All Users",
    lastUpdated: "2024-01-10",
    compliance: 94,
  },
  {
    id: "policy-002",
    name: "Two-Factor Authentication",
    description: "Mandatory 2FA for admin and super admin roles",
    status: "active",
    appliedTo: "Admin Users",
    lastUpdated: "2024-01-08",
    compliance: 87,
  },
  {
    id: "policy-003",
    name: "Session Management",
    description: "Auto-logout after 30 minutes of inactivity",
    status: "active",
    appliedTo: "All Users",
    lastUpdated: "2024-01-05",
    compliance: 100,
  },
  {
    id: "policy-004",
    name: "IP Whitelisting",
    description: "Restrict admin access to approved IP ranges",
    status: "draft",
    appliedTo: "Super Admin",
    lastUpdated: "2024-01-15",
    compliance: 0,
  },
];

const userSessions = [
  {
    id: "session-001",
    user: "admin@restaurant.com",
    role: "admin",
    ipAddress: "192.168.1.50",
    location: "New York, USA",
    device: "Chrome on Windows",
    loginTime: "2024-01-15 08:30",
    lastActivity: "2024-01-15 16:45",
    status: "active",
  },
  {
    id: "session-002",
    user: "manager@restaurant.com",
    role: "manager",
    ipAddress: "192.168.1.51",
    location: "New York, USA",
    device: "Safari on iPhone",
    loginTime: "2024-01-15 09:15",
    lastActivity: "2024-01-15 16:40",
    status: "active",
  },
  {
    id: "session-003",
    user: "staff@restaurant.com",
    role: "staff",
    ipAddress: "192.168.1.52",
    location: "New York, USA",
    device: "Chrome on Android",
    loginTime: "2024-01-15 10:00",
    lastActivity: "2024-01-15 14:30",
    status: "expired",
  },
];

const securityFeatures = [
  {
    name: "Encryption at Rest",
    status: "enabled",
    description: "AES-256 encryption for stored data",
    coverage: 100,
  },
  {
    name: "Encryption in Transit",
    status: "enabled",
    description: "TLS 1.3 for all data transmission",
    coverage: 100,
  },
  {
    name: "API Rate Limiting",
    status: "enabled",
    description: "Prevents API abuse and DDoS attacks",
    coverage: 95,
  },
  {
    name: "Audit Logging",
    status: "enabled",
    description: "Comprehensive activity logging",
    coverage: 98,
  },
  {
    name: "Vulnerability Scanning",
    status: "enabled",
    description: "Automated security vulnerability detection",
    coverage: 92,
  },
  {
    name: "Backup Encryption",
    status: "enabled",
    description: "Encrypted backups with key rotation",
    coverage: 100,
  },
];

const alertTypeColors = {
  critical: "bg-red-500",
  warning: "bg-yellow-500",
  info: "bg-blue-500",
};

const statusColors = {
  active: "bg-red-500",
  investigating: "bg-yellow-500",
  resolved: "bg-green-500",
  blocked: "bg-gray-500",
  enabled: "bg-green-500",
  disabled: "bg-red-500",
  draft: "bg-yellow-500",
  expired: "bg-gray-500",
};

export default function Security() {
  const [isAddingPolicy, setIsAddingPolicy] = useState(false);
  const [selectedAlert, setSelectedAlert] = useState<string | null>(null);
  const [policyName, setPolicyName] = useState("");
  const [policyDescription, setPolicyDescription] = useState("");

  const getAlertIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "info":
        return <CheckCircle2 className="h-5 w-5 text-blue-600" />;
      default:
        return <Shield className="h-5 w-5 text-gray-600" />;
    }
  };

  const handleTerminateSession = (sessionId: string) => {
    console.log(`Terminating session: ${sessionId}`);
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
            Security Center
          </h1>
          <p className="text-muted-foreground">
            Monitor security threats, manage access controls, and enforce
            policies
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Activity className="h-4 w-4 mr-2" />
            Security Scan
          </Button>
          <Dialog open={isAddingPolicy} onOpenChange={setIsAddingPolicy}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Policy
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Security Policy</DialogTitle>
                <DialogDescription>
                  Define a new security policy for your organization
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="policy-name">Policy Name</Label>
                  <Input
                    id="policy-name"
                    value={policyName}
                    onChange={(e) => setPolicyName(e.target.value)}
                    placeholder="e.g., Device Management Policy"
                  />
                </div>
                <div>
                  <Label htmlFor="policy-description">Description</Label>
                  <Textarea
                    id="policy-description"
                    value={policyDescription}
                    onChange={(e) => setPolicyDescription(e.target.value)}
                    placeholder="Describe the policy requirements and scope"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsAddingPolicy(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => setIsAddingPolicy(false)}>
                  Create Policy
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Security Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">98.5%</p>
                <p className="text-sm text-muted-foreground">Security Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">Active Threats</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Active Sessions</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Lock className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">4</p>
                <p className="text-sm text-muted-foreground">
                  Security Policies
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="threats" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="threats">Threat Monitor</TabsTrigger>
          <TabsTrigger value="policies">Access Policies</TabsTrigger>
          <TabsTrigger value="sessions">User Sessions</TabsTrigger>
          <TabsTrigger value="features">Security Features</TabsTrigger>
          <TabsTrigger value="compliance">Compliance</TabsTrigger>
        </TabsList>

        {/* Threat Monitor */}
        <TabsContent value="threats" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Alerts & Threats</CardTitle>
              <CardDescription>
                Real-time security event monitoring and incident response
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {securityAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center space-x-2">
                        {getAlertIcon(alert.type)}
                        <div
                          className={`w-3 h-3 rounded-full ${alertTypeColors[alert.type as keyof typeof alertTypeColors]}`}
                        ></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{alert.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          {alert.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {alert.timestamp}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            User: {alert.affectedUser}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant={
                          alert.severity === "high"
                            ? "destructive"
                            : alert.severity === "medium"
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {alert.severity}
                      </Badge>
                      <Badge
                        variant={
                          alert.status === "active"
                            ? "destructive"
                            : alert.status === "resolved"
                              ? "default"
                              : "secondary"
                        }
                      >
                        {alert.status}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        Investigate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Access Policies */}
        <TabsContent value="policies" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Policies</CardTitle>
              <CardDescription>
                Manage access controls, authentication, and security
                requirements
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {accessPolicies.map((policy) => (
                  <div
                    key={policy.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900">
                        <Lock className="h-5 w-5 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{policy.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {policy.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <span className="text-xs text-muted-foreground">
                            Applied to: {policy.appliedTo}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Updated: {policy.lastUpdated}
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="text-xs text-muted-foreground">
                            Compliance:
                          </span>
                          <Progress
                            value={policy.compliance}
                            className="w-24 h-2"
                          />
                          <span className="text-xs text-muted-foreground">
                            {policy.compliance}%
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant={
                          policy.status === "active" ? "default" : "secondary"
                        }
                      >
                        {policy.status}
                      </Badge>
                      <Switch
                        checked={policy.status === "active"}
                        onCheckedChange={() =>
                          console.log(`Toggle policy ${policy.id}`)
                        }
                      />
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

        {/* User Sessions */}
        <TabsContent value="sessions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Active User Sessions</CardTitle>
              <CardDescription>
                Monitor and manage user authentication sessions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {userSessions.map((session) => (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900">
                        <Users className="h-5 w-5 text-green-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{session.user}</h3>
                        <p className="text-sm text-muted-foreground">
                          {session.device} • {session.location}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-muted-foreground">
                            IP: {session.ipAddress}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Login: {session.loginTime}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Last: {session.lastActivity}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge variant="outline">{session.role}</Badge>
                      <Badge
                        variant={
                          session.status === "active" ? "default" : "secondary"
                        }
                      >
                        {session.status}
                      </Badge>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTerminateSession(session.id)}
                        disabled={session.status !== "active"}
                      >
                        <Ban className="h-4 w-4 mr-1" />
                        Terminate
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Features */}
        <TabsContent value="features" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Security Features</CardTitle>
              <CardDescription>
                System-wide security capabilities and their status
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {securityFeatures.map((feature) => (
                  <div key={feature.name} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{feature.name}</h3>
                      <Badge
                        variant={
                          feature.status === "enabled" ? "default" : "secondary"
                        }
                      >
                        {feature.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">
                      {feature.description}
                    </p>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        Coverage:
                      </span>
                      <Progress
                        value={feature.coverage}
                        className="flex-1 h-2"
                      />
                      <span className="text-xs text-muted-foreground">
                        {feature.coverage}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Compliance */}
        <TabsContent value="compliance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Compliance Standards</CardTitle>
                <CardDescription>
                  Industry security compliance status
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>ISO 27001</span>
                  </div>
                  <Badge variant="default">Compliant</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>SOC 2 Type II</span>
                  </div>
                  <Badge variant="default">Compliant</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span>PCI DSS</span>
                  </div>
                  <Badge variant="secondary">In Progress</Badge>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                    <span>GDPR</span>
                  </div>
                  <Badge variant="default">Compliant</Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audit Trail</CardTitle>
                <CardDescription>
                  Recent security and compliance activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3 text-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>Security policy updated</span>
                    <span className="text-muted-foreground text-xs">
                      2h ago
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                    <span>Compliance scan completed</span>
                    <span className="text-muted-foreground text-xs">
                      4h ago
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>Security incident detected</span>
                    <span className="text-muted-foreground text-xs">
                      6h ago
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>User access review completed</span>
                    <span className="text-muted-foreground text-xs">
                      1d ago
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

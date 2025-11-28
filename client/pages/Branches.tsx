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
import {
  GitBranch,
  Plus,
  Database,
  ArrowRight,
  Activity,
  Clock,
  Settings,
  Workflow,
} from "lucide-react";

// Mock branch configuration data
const branches = [
  {
    id: "main-branch",
    name: "Main Production",
    type: "production",
    status: "active",
    dataFlow: "bidirectional",
    lastSync: "2024-01-15 14:30",
    itemCount: 245,
    categoryCount: 12,
    connectedSystems: ["POS", "Inventory", "Analytics"],
  },
  {
    id: "staging-branch",
    name: "Staging Environment",
    type: "staging",
    status: "active",
    dataFlow: "upstream",
    lastSync: "2024-01-15 12:15",
    itemCount: 180,
    categoryCount: 10,
    connectedSystems: ["POS", "Testing"],
  },
  {
    id: "backup-branch",
    name: "Backup Store",
    type: "backup",
    status: "inactive",
    dataFlow: "downstream",
    lastSync: "2024-01-14 23:45",
    itemCount: 245,
    categoryCount: 12,
    connectedSystems: ["Archive"],
  },
  {
    id: "dev-branch",
    name: "Development",
    type: "development",
    status: "active",
    dataFlow: "isolated",
    lastSync: "2024-01-15 16:20",
    itemCount: 95,
    categoryCount: 8,
    connectedSystems: ["Development Tools"],
  },
];

const dataFlowColors = {
  bidirectional: "bg-green-500",
  upstream: "bg-blue-500",
  downstream: "bg-orange-500",
  isolated: "bg-purple-500",
};

const typeColors = {
  production: "bg-green-600",
  staging: "bg-yellow-600",
  backup: "bg-gray-600",
  development: "bg-blue-600",
};

export default function Branches() {
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
            Branch Configuration
          </h1>
          <p className="text-muted-foreground">
            Manage data flow and routing between system branches
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Workflow className="h-4 w-4 mr-2" />
            Sync All
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Plus className="h-4 w-4 mr-2" />
            New Branch
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <GitBranch className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">4</p>
                <p className="text-sm text-muted-foreground">Total Branches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Activity className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">3</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">765</p>
                <p className="text-sm text-muted-foreground">Total Items</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Clock className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">5m</p>
                <p className="text-sm text-muted-foreground">Last Sync</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Branch Flow Diagram */}
      <Card>
        <CardHeader>
          <CardTitle>Data Flow Architecture</CardTitle>
          <CardDescription>
            Visual representation of data flow between branches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8 bg-muted/20 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-center">
              {branches.map((branch, index) => (
                <div
                  key={branch.id}
                  className="flex flex-col items-center space-y-2"
                >
                  <div
                    className={`w-16 h-16 rounded-full ${typeColors[branch.type as keyof typeof typeColors]} flex items-center justify-center`}
                  >
                    <GitBranch className="h-8 w-8 text-white" />
                  </div>
                  <div className="text-center">
                    <div className="font-medium text-sm">{branch.name}</div>
                    <Badge variant="outline" className="text-xs mt-1">
                      {branch.type}
                    </Badge>
                  </div>
                  {index < branches.length - 1 && (
                    <ArrowRight className="h-4 w-4 text-muted-foreground absolute translate-x-16 md:translate-x-24" />
                  )}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Branches List */}
      <Card>
        <CardHeader>
          <CardTitle>Branch Management</CardTitle>
          <CardDescription>
            Configure and monitor all system branches
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {branches.map((branch) => (
              <div
                key={branch.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
              >
                <div className="flex items-center space-x-4">
                  <div
                    className={`w-12 h-12 rounded-lg ${typeColors[branch.type as keyof typeof typeColors]} flex items-center justify-center`}
                  >
                    <GitBranch className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{branch.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {branch.itemCount} items • {branch.categoryCount}{" "}
                      categories
                    </p>
                    <div className="flex items-center space-x-4 mt-1">
                      <span className="text-xs text-muted-foreground flex items-center">
                        <Clock className="h-3 w-3 mr-1" />
                        {branch.lastSync}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {branch.connectedSystems.join(", ")}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    <div
                      className={`w-3 h-3 rounded-full ${dataFlowColors[branch.dataFlow as keyof typeof dataFlowColors]}`}
                    ></div>
                    <span className="text-sm capitalize">
                      {branch.dataFlow}
                    </span>
                  </div>
                  <Badge
                    variant={
                      branch.status === "active" ? "default" : "secondary"
                    }
                  >
                    {branch.status}
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

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Sync Operations</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">
                <ArrowRight className="h-4 w-4 mr-2" />
                Push to Staging
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <ArrowRight className="h-4 w-4 mr-2" />
                Deploy to Production
              </Button>
              <Button variant="outline" className="w-full justify-start">
                <Database className="h-4 w-4 mr-2" />
                Create Backup
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Branch Health</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Production</span>
                <Badge variant="default">Healthy</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Staging</span>
                <Badge variant="default">Healthy</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Development</span>
                <Badge variant="outline">Warning</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-sm">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>Data sync completed</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                <span>New branch created</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                <span>Configuration updated</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

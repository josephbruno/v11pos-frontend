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
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Database,
  Upload,
  Download,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Clock,
  ArrowRight,
  FileText,
  Settings,
  Play,
  Pause,
  Square,
} from "lucide-react";

// Mock migration data
const migrations = [
  {
    id: "mig-001",
    name: "Categories Migration",
    source: "Legacy POS System",
    target: "New POS Database",
    status: "completed",
    progress: 100,
    itemsTotal: 1250,
    itemsMigrated: 1250,
    startTime: "2024-01-15 09:00",
    endTime: "2024-01-15 09:45",
    duration: "45 minutes",
  },
  {
    id: "mig-002",
    name: "Product Data Sync",
    source: "Main Branch",
    target: "Mall Branch",
    status: "in_progress",
    progress: 67,
    itemsTotal: 890,
    itemsMigrated: 596,
    startTime: "2024-01-15 14:30",
    endTime: null,
    duration: "Running...",
  },
  {
    id: "mig-003",
    name: "Customer Records",
    source: "CRM System",
    target: "Unified Database",
    status: "pending",
    progress: 0,
    itemsTotal: 3420,
    itemsMigrated: 0,
    startTime: null,
    endTime: null,
    duration: "Scheduled",
  },
  {
    id: "mig-004",
    name: "Inventory Backup",
    source: "Production DB",
    target: "Backup Storage",
    status: "failed",
    progress: 23,
    itemsTotal: 567,
    itemsMigrated: 130,
    startTime: "2024-01-14 22:00",
    endTime: "2024-01-14 22:15",
    duration: "Failed after 15min",
  },
];

const dataSources = [
  { id: "legacy-pos", name: "Legacy POS System", type: "database" },
  { id: "main-branch", name: "Main Branch DB", type: "database" },
  { id: "crm-system", name: "CRM System", type: "api" },
  { id: "csv-import", name: "CSV File Import", type: "file" },
  { id: "backup-storage", name: "Backup Storage", type: "storage" },
];

const migrationTemplates = [
  {
    id: "full-sync",
    name: "Full System Sync",
    description: "Complete data synchronization",
  },
  {
    id: "incremental",
    name: "Incremental Update",
    description: "Only changed data",
  },
  {
    id: "category-only",
    name: "Categories Only",
    description: "Migrate category structure",
  },
  {
    id: "products-only",
    name: "Products Only",
    description: "Migrate product data",
  },
];

const statusColors = {
  completed: "bg-green-500",
  in_progress: "bg-blue-500",
  pending: "bg-yellow-500",
  failed: "bg-red-500",
};

export default function Migration() {
  const [selectedSource, setSelectedSource] = useState("");
  const [selectedTarget, setSelectedTarget] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-600" />;
      case "in_progress":
        return <RefreshCw className="h-5 w-5 text-blue-600 animate-spin" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-600" />;
      case "failed":
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Database className="h-5 w-5 text-gray-600" />;
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
            Data Migration Center
          </h1>
          <p className="text-muted-foreground">
            Transfer and synchronize data between systems and branches
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Migration Log
          </Button>
          <Button className="bg-primary hover:bg-primary/90">
            <Upload className="h-4 w-4 mr-2" />
            New Migration
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Database className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">4</p>
                <p className="text-sm text-muted-foreground">
                  Total Migrations
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <RefreshCw className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-muted-foreground">In Progress</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">1</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="active" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="active">Active Migrations</TabsTrigger>
          <TabsTrigger value="new">New Migration</TabsTrigger>
          <TabsTrigger value="history">History</TabsTrigger>
        </TabsList>

        {/* Active Migrations */}
        <TabsContent value="active" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Running Migrations</CardTitle>
              <CardDescription>
                Monitor active data transfer operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {migrations
                  .filter(
                    (mig) =>
                      mig.status === "in_progress" || mig.status === "pending",
                  )
                  .map((migration) => (
                    <div
                      key={migration.id}
                      className="flex items-center justify-between p-4 border rounded-lg"
                    >
                      <div className="flex items-center space-x-4 flex-1">
                        <div className="flex items-center space-x-2">
                          {getStatusIcon(migration.status)}
                          <div>
                            <h3 className="font-semibold">{migration.name}</h3>
                            <p className="text-sm text-muted-foreground">
                              {migration.source} → {migration.target}
                            </p>
                          </div>
                        </div>
                        <div className="flex-1 max-w-md">
                          <div className="flex justify-between text-sm mb-1">
                            <span>
                              {migration.itemsMigrated} / {migration.itemsTotal}{" "}
                              items
                            </span>
                            <span>{migration.progress}%</span>
                          </div>
                          <Progress
                            value={migration.progress}
                            className="h-2"
                          />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            migration.status === "in_progress"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {migration.status.replace("_", " ")}
                        </Badge>
                        <Button variant="outline" size="sm">
                          {migration.status === "in_progress" ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button variant="outline" size="sm">
                          <Square className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* New Migration */}
        <TabsContent value="new" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Create New Migration</CardTitle>
              <CardDescription>
                Set up a new data transfer operation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Source System
                  </label>
                  <Select
                    value={selectedSource}
                    onValueChange={setSelectedSource}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select source" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataSources.map((source) => (
                        <SelectItem key={source.id} value={source.id}>
                          <div className="flex items-center space-x-2">
                            <Database className="h-4 w-4" />
                            <span>{source.name}</span>
                            <Badge variant="outline">{source.type}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Target System
                  </label>
                  <Select
                    value={selectedTarget}
                    onValueChange={setSelectedTarget}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select target" />
                    </SelectTrigger>
                    <SelectContent>
                      {dataSources.map((target) => (
                        <SelectItem key={target.id} value={target.id}>
                          <div className="flex items-center space-x-2">
                            <Database className="h-4 w-4" />
                            <span>{target.name}</span>
                            <Badge variant="outline">{target.type}</Badge>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">
                  Migration Template
                </label>
                <Select
                  value={selectedTemplate}
                  onValueChange={setSelectedTemplate}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select migration type" />
                  </SelectTrigger>
                  <SelectContent>
                    {migrationTemplates.map((template) => (
                      <SelectItem key={template.id} value={template.id}>
                        <div>
                          <div className="font-medium">{template.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {template.description}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <Button variant="outline">
                  <Settings className="h-4 w-4 mr-2" />
                  Advanced Settings
                </Button>
                <div className="flex space-x-2">
                  <Button variant="outline">Preview</Button>
                  <Button
                    disabled={
                      !selectedSource || !selectedTarget || !selectedTemplate
                    }
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Migration
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Migration History */}
        <TabsContent value="history" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Migration History</CardTitle>
              <CardDescription>
                View completed and failed migration operations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {migrations.map((migration) => (
                  <div
                    key={migration.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-3 h-3 rounded-full ${statusColors[migration.status as keyof typeof statusColors]}`}
                      ></div>
                      <div>
                        <h3 className="font-semibold">{migration.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {migration.source} → {migration.target}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {migration.itemsMigrated} / {migration.itemsTotal}{" "}
                          items • {migration.duration}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant={
                          migration.status === "completed"
                            ? "default"
                            : migration.status === "failed"
                              ? "destructive"
                              : "secondary"
                        }
                      >
                        {migration.status.replace("_", " ")}
                      </Badge>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        Details
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}

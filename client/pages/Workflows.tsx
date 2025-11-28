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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Workflow,
  Plus,
  Play,
  Pause,
  Settings,
  Clock,
  Zap,
  GitBranch,
  CheckCircle2,
  AlertTriangle,
  BarChart3,
  Bot,
  Calendar,
  Mail,
  Database,
  FileText,
  Edit,
  Trash2,
  Copy,
} from "lucide-react";

// Mock workflow data
const workflows = [
  {
    id: "wf-001",
    name: "Daily Sales Report",
    description: "Generate and send daily sales reports to management",
    status: "active",
    trigger: "schedule",
    schedule: "Daily at 6:00 PM",
    lastRun: "2024-01-15 18:00",
    nextRun: "2024-01-16 18:00",
    successRate: 98,
    totalRuns: 245,
    category: "reporting",
    actions: ["Generate Report", "Send Email", "Update Dashboard"],
  },
  {
    id: "wf-002",
    name: "Low Stock Alert",
    description: "Notify when inventory falls below minimum levels",
    status: "active",
    trigger: "event",
    schedule: "On stock change",
    lastRun: "2024-01-15 14:30",
    nextRun: "On trigger",
    successRate: 100,
    totalRuns: 89,
    category: "inventory",
    actions: ["Check Stock", "Send Alert", "Create Purchase Order"],
  },
  {
    id: "wf-003",
    name: "Customer Feedback Sync",
    description: "Sync customer feedback from QR orders to CRM",
    status: "paused",
    trigger: "schedule",
    schedule: "Every 2 hours",
    lastRun: "2024-01-15 12:00",
    nextRun: "Paused",
    successRate: 95,
    totalRuns: 156,
    category: "customer",
    actions: ["Fetch Feedback", "Process Data", "Update CRM"],
  },
  {
    id: "wf-004",
    name: "Branch Data Sync",
    description: "Synchronize product data across all branches",
    status: "error",
    trigger: "schedule",
    schedule: "Every 6 hours",
    lastRun: "2024-01-15 06:00",
    nextRun: "Error - Manual intervention required",
    successRate: 87,
    totalRuns: 324,
    category: "sync",
    actions: ["Validate Data", "Sync Changes", "Verify Integrity"],
  },
];

const workflowTemplates = [
  {
    id: "template-1",
    name: "Sales Report Automation",
    description: "Automated daily/weekly sales reporting",
    category: "reporting",
    icon: BarChart3,
    triggers: ["Schedule", "Manual"],
    estimatedTime: "5 minutes",
  },
  {
    id: "template-2",
    name: "Inventory Management",
    description: "Stock monitoring and reorder automation",
    category: "inventory",
    icon: Database,
    triggers: ["Event", "Schedule"],
    estimatedTime: "2 minutes",
  },
  {
    id: "template-3",
    name: "Customer Communication",
    description: "Automated customer notifications and feedback",
    category: "customer",
    icon: Mail,
    triggers: ["Event", "Manual"],
    estimatedTime: "3 minutes",
  },
  {
    id: "template-4",
    name: "Data Synchronization",
    description: "Cross-system data sync and validation",
    category: "sync",
    icon: GitBranch,
    triggers: ["Schedule", "Event"],
    estimatedTime: "10 minutes",
  },
];

const statusColors = {
  active: "bg-green-500",
  paused: "bg-yellow-500",
  error: "bg-red-500",
  inactive: "bg-gray-500",
};

const categoryColors = {
  reporting: "bg-blue-600",
  inventory: "bg-green-600",
  customer: "bg-purple-600",
  sync: "bg-orange-600",
};

export default function Workflows() {
  const [isCreatingWorkflow, setIsCreatingWorkflow] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [workflowName, setWorkflowName] = useState("");
  const [workflowDescription, setWorkflowDescription] = useState("");

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <Play className="h-4 w-4 text-green-600" />;
      case "paused":
        return <Pause className="h-4 w-4 text-yellow-600" />;
      case "error":
        return <AlertTriangle className="h-4 w-4 text-red-600" />;
      default:
        return <CheckCircle2 className="h-4 w-4 text-gray-600" />;
    }
  };

  const handleToggleWorkflow = (workflowId: string) => {
    console.log(`Toggling workflow: ${workflowId}`);
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
            Workflow Automation
          </h1>
          <p className="text-muted-foreground">
            Create and manage automated business processes
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <FileText className="h-4 w-4 mr-2" />
            Workflow Logs
          </Button>
          <Dialog
            open={isCreatingWorkflow}
            onOpenChange={setIsCreatingWorkflow}
          >
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Workflow
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Workflow</DialogTitle>
                <DialogDescription>
                  Set up an automated workflow using templates or create from
                  scratch
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="template">Workflow Template</Label>
                  <Select
                    value={selectedTemplate}
                    onValueChange={setSelectedTemplate}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a template or create custom" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="custom">Custom Workflow</SelectItem>
                      {workflowTemplates.map((template) => (
                        <SelectItem key={template.id} value={template.id}>
                          <div className="flex items-center space-x-2">
                            <template.icon className="h-4 w-4" />
                            <span>{template.name}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="workflow-name">Workflow Name</Label>
                  <Input
                    id="workflow-name"
                    value={workflowName}
                    onChange={(e) => setWorkflowName(e.target.value)}
                    placeholder="Enter workflow name"
                  />
                </div>
                <div>
                  <Label htmlFor="workflow-description">Description</Label>
                  <Textarea
                    id="workflow-description"
                    value={workflowDescription}
                    onChange={(e) => setWorkflowDescription(e.target.value)}
                    placeholder="Describe what this workflow does"
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsCreatingWorkflow(false)}
                >
                  Cancel
                </Button>
                <Button onClick={() => setIsCreatingWorkflow(false)}>
                  Create Workflow
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Workflow className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">4</p>
                <p className="text-sm text-muted-foreground">Total Workflows</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">2</p>
                <p className="text-sm text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">814</p>
                <p className="text-sm text-muted-foreground">Total Runs</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">95%</p>
                <p className="text-sm text-muted-foreground">Success Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="workflows" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="workflows">Active Workflows</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="logs">Execution Logs</TabsTrigger>
        </TabsList>

        {/* Active Workflows */}
        <TabsContent value="workflows" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Management</CardTitle>
              <CardDescription>
                Monitor and control automated business processes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(workflow.status)}
                        <div
                          className={`w-3 h-3 rounded-full ${statusColors[workflow.status as keyof typeof statusColors]}`}
                        ></div>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{workflow.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {workflow.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {workflow.schedule}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {workflow.totalRuns} runs • {workflow.successRate}%
                            success
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant="outline"
                        className={`${categoryColors[workflow.category as keyof typeof categoryColors]} text-white border-transparent`}
                      >
                        {workflow.category}
                      </Badge>
                      <Switch
                        checked={workflow.status === "active"}
                        onCheckedChange={() =>
                          handleToggleWorkflow(workflow.id)
                        }
                      />
                      <Button variant="outline" size="sm">
                        <Settings className="h-4 w-4 mr-1" />
                        Configure
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

        {/* Templates */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Workflow Templates</CardTitle>
              <CardDescription>
                Pre-built workflow templates for common automation tasks
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {workflowTemplates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 border rounded-lg hover:bg-muted/50 cursor-pointer"
                    onClick={() => {
                      setSelectedTemplate(template.id);
                      setWorkflowName(template.name);
                      setWorkflowDescription(template.description);
                      setIsCreatingWorkflow(true);
                    }}
                  >
                    <div className="flex items-start space-x-3">
                      <div
                        className={`p-2 rounded-lg ${categoryColors[template.category as keyof typeof categoryColors]}`}
                      >
                        <template.icon className="h-5 w-5 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{template.name}</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {template.description}
                        </p>
                        <div className="flex items-center space-x-4 mt-2">
                          <Badge variant="outline">{template.category}</Badge>
                          <span className="text-xs text-muted-foreground">
                            ~{template.estimatedTime}
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {template.triggers.map((trigger) => (
                            <Badge
                              key={trigger}
                              variant="secondary"
                              className="text-xs"
                            >
                              {trigger}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Execution Logs */}
        <TabsContent value="logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Execution History</CardTitle>
              <CardDescription>
                View workflow execution logs and performance metrics
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {workflows.map((workflow) => (
                  <div
                    key={workflow.id}
                    className="flex items-center justify-between p-4 border rounded-lg"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`w-3 h-3 rounded-full ${statusColors[workflow.status as keyof typeof statusColors]}`}
                      ></div>
                      <div>
                        <h3 className="font-medium">{workflow.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          Last run: {workflow.lastRun} • Next:{" "}
                          {workflow.nextRun}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="text-sm font-medium">
                          {workflow.successRate}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {workflow.totalRuns} runs
                        </div>
                      </div>
                      <Button variant="outline" size="sm">
                        <FileText className="h-4 w-4 mr-1" />
                        View Logs
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

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import {
  CalendarIcon,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Clock,
  Users,
  MapPin,
  Phone,
  Mail,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Eye,
  Edit,
  Trash2,
  UserCheck,
  Calendar as CalendarSchedule,
  Settings,
  Download,
} from "lucide-react";

// Mock data for table bookings
const mockBookings = [
  {
    id: "booking-001",
    bookingNumber: "BK-2024-001",
    customerName: "John Smith",
    customerEmail: "john.smith@email.com",
    customerPhone: "+1-555-0123",
    tableId: "table-1",
    tableName: "Table 1",
    partySize: 4,
    bookingDate: new Date("2024-01-16"),
    bookingTime: "19:00",
    duration: 120,
    status: "confirmed",
    occasion: "anniversary",
    specialRequests: "Window seat, anniversary decoration",
    source: "online",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "booking-002",
    bookingNumber: "BK-2024-002",
    customerName: "Sarah Johnson",
    customerEmail: "sarah.j@email.com",
    customerPhone: "+1-555-0456",
    tableId: "table-5",
    tableName: "Table 5",
    partySize: 2,
    bookingDate: new Date("2024-01-16"),
    bookingTime: "18:30",
    duration: 90,
    status: "pending",
    occasion: "date",
    source: "phone",
    createdAt: new Date("2024-01-15"),
  },
  {
    id: "booking-003",
    bookingNumber: "BK-2024-003",
    customerName: "Michael Chen",
    customerEmail: "m.chen@email.com",
    customerPhone: "+1-555-0789",
    tableId: "table-3",
    tableName: "Table 3",
    partySize: 6,
    bookingDate: new Date("2024-01-17"),
    bookingTime: "20:00",
    duration: 150,
    status: "seated",
    occasion: "business",
    source: "admin",
    createdAt: new Date("2024-01-16"),
  },
  {
    id: "booking-004",
    bookingNumber: "BK-2024-004",
    customerName: "Emma Davis",
    customerEmail: "emma.davis@email.com",
    customerPhone: "+1-555-0321",
    tableId: "table-2",
    tableName: "Table 2",
    partySize: 8,
    bookingDate: new Date("2024-01-15"),
    bookingTime: "19:30",
    duration: 180,
    status: "completed",
    occasion: "birthday",
    specialRequests: "Birthday cake, group seating",
    source: "online",
    createdAt: new Date("2024-01-14"),
  },
];

const mockTables = [
  {
    id: "table-1",
    tableNumber: "Table 1",
    capacity: 4,
    location: "Main Dining",
    type: "regular",
  },
  {
    id: "table-2",
    tableNumber: "Table 2",
    capacity: 8,
    location: "Main Dining",
    type: "regular",
  },
  {
    id: "table-3",
    tableNumber: "Table 3",
    capacity: 6,
    location: "Window Side",
    type: "vip",
  },
  {
    id: "table-4",
    tableNumber: "Table 4",
    capacity: 2,
    location: "Terrace",
    type: "outdoor",
  },
  {
    id: "table-5",
    tableNumber: "Table 5",
    capacity: 4,
    location: "Private Room",
    type: "private",
  },
];

const statusColors = {
  pending: "bg-yellow-500",
  confirmed: "bg-blue-500",
  seated: "bg-green-500",
  completed: "bg-gray-500",
  cancelled: "bg-red-500",
  no_show: "bg-red-600",
};

const statusIcons = {
  pending: AlertCircle,
  confirmed: CheckCircle2,
  seated: UserCheck,
  completed: CheckCircle2,
  cancelled: XCircle,
  no_show: XCircle,
};

export default function TableBooking() {
  const [mounted, setMounted] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isNewBookingOpen, setIsNewBookingOpen] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // New booking form state
  const [newBooking, setNewBooking] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    partySize: 2,
    bookingDate: new Date(),
    bookingTime: "",
    tableId: "",
    specialRequests: "",
    occasion: "",
  });

  const filteredBookings = mockBookings.filter((booking) => {
    const matchesSearch =
      booking.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      booking.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all" || booking.status === filterStatus;
    const matchesDate = selectedDate
      ? booking.bookingDate.toDateString() === selectedDate.toDateString()
      : true;

    return matchesSearch && matchesStatus && matchesDate;
  });

  const getStatusIcon = (status: string) => {
    const IconComponent =
      statusIcons[status as keyof typeof statusIcons] || AlertCircle;
    return <IconComponent className="h-4 w-4" />;
  };

  const handleStatusChange = (bookingId: string, newStatus: string) => {
    console.log(`Changing booking ${bookingId} status to ${newStatus}`);
  };

  const handleCreateBooking = () => {
    console.log("Creating new booking:", newBooking);
    setIsNewBookingOpen(false);
    // Reset form
    setNewBooking({
      customerName: "",
      customerEmail: "",
      customerPhone: "",
      partySize: 2,
      bookingDate: new Date(),
      bookingTime: "",
      tableId: "",
      specialRequests: "",
      occasion: "",
    });
  };

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Table Booking Management
          </h1>
          <p className="text-muted-foreground">
            Manage restaurant reservations and table availability
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Dialog open={isNewBookingOpen} onOpenChange={setIsNewBookingOpen}>
            <DialogTrigger asChild>
              <Button className="bg-primary hover:bg-primary/90">
                <Plus className="h-4 w-4 mr-2" />
                New Booking
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Booking</DialogTitle>
                <DialogDescription>
                  Create a new table reservation for a customer
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="customer-name">Customer Name</Label>
                  <Input
                    id="customer-name"
                    value={newBooking.customerName}
                    onChange={(e) =>
                      setNewBooking((prev) => ({
                        ...prev,
                        customerName: e.target.value,
                      }))
                    }
                    placeholder="Enter customer name"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-phone">Phone Number</Label>
                  <Input
                    id="customer-phone"
                    value={newBooking.customerPhone}
                    onChange={(e) =>
                      setNewBooking((prev) => ({
                        ...prev,
                        customerPhone: e.target.value,
                      }))
                    }
                    placeholder="Enter phone number"
                  />
                </div>
                <div>
                  <Label htmlFor="customer-email">Email</Label>
                  <Input
                    id="customer-email"
                    type="email"
                    value={newBooking.customerEmail}
                    onChange={(e) =>
                      setNewBooking((prev) => ({
                        ...prev,
                        customerEmail: e.target.value,
                      }))
                    }
                    placeholder="Enter email address"
                  />
                </div>
                <div>
                  <Label htmlFor="party-size">Party Size</Label>
                  <Select
                    value={newBooking.partySize.toString()}
                    onValueChange={(value) =>
                      setNewBooking((prev) => ({
                        ...prev,
                        partySize: parseInt(value),
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 12, 15, 20].map(
                        (size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size} {size === 1 ? "person" : "people"}
                          </SelectItem>
                        ),
                      )}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="booking-date">Booking Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {newBooking.bookingDate
                          ? format(newBooking.bookingDate, "PPP")
                          : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={newBooking.bookingDate}
                        onSelect={(date) =>
                          date &&
                          setNewBooking((prev) => ({
                            ...prev,
                            bookingDate: date,
                          }))
                        }
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div>
                  <Label htmlFor="booking-time">Booking Time</Label>
                  <Select
                    value={newBooking.bookingTime}
                    onValueChange={(value) =>
                      setNewBooking((prev) => ({ ...prev, bookingTime: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select time" />
                    </SelectTrigger>
                    <SelectContent>
                      {[
                        "17:00",
                        "17:30",
                        "18:00",
                        "18:30",
                        "19:00",
                        "19:30",
                        "20:00",
                        "20:30",
                        "21:00",
                        "21:30",
                      ].map((time) => (
                        <SelectItem key={time} value={time}>
                          {time}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="table-select">Preferred Table</Label>
                  <Select
                    value={newBooking.tableId}
                    onValueChange={(value) =>
                      setNewBooking((prev) => ({ ...prev, tableId: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select table" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockTables.map((table) => (
                        <SelectItem key={table.id} value={table.id}>
                          {table.tableNumber} - {table.capacity} seats (
                          {table.location})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="occasion">Occasion</Label>
                  <Select
                    value={newBooking.occasion}
                    onValueChange={(value) =>
                      setNewBooking((prev) => ({ ...prev, occasion: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select occasion" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Dining</SelectItem>
                      <SelectItem value="birthday">Birthday</SelectItem>
                      <SelectItem value="anniversary">Anniversary</SelectItem>
                      <SelectItem value="date">Date Night</SelectItem>
                      <SelectItem value="business">Business Meeting</SelectItem>
                      <SelectItem value="celebration">Celebration</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2">
                  <Label htmlFor="special-requests">Special Requests</Label>
                  <Textarea
                    id="special-requests"
                    value={newBooking.specialRequests}
                    onChange={(e) =>
                      setNewBooking((prev) => ({
                        ...prev,
                        specialRequests: e.target.value,
                      }))
                    }
                    placeholder="Any special requests or notes..."
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsNewBookingOpen(false)}
                >
                  Cancel
                </Button>
                <Button onClick={handleCreateBooking}>Create Booking</Button>
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
              <CalendarSchedule className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">24</p>
                <p className="text-sm text-muted-foreground">
                  Today's Bookings
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
                <p className="text-2xl font-bold">18</p>
                <p className="text-sm text-muted-foreground">Confirmed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <Users className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-2xl font-bold">92</p>
                <p className="text-sm text-muted-foreground">Total Guests</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2">
              <MapPin className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-2xl font-bold">85%</p>
                <p className="text-sm text-muted-foreground">
                  Table Utilization
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col space-y-4 md:flex-row md:space-y-0 md:space-x-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by customer name or booking number..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full md:w-[200px]">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Select date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={selectedDate}
                    onSelect={setSelectedDate}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full md:w-[180px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="confirmed">Confirmed</SelectItem>
                <SelectItem value="seated">Seated</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
                <SelectItem value="no_show">No Show</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Tabs defaultValue="bookings" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="bookings">All Bookings</TabsTrigger>
          <TabsTrigger value="tables">Table Management</TabsTrigger>
          <TabsTrigger value="calendar">Calendar View</TabsTrigger>
        </TabsList>

        {/* Bookings List */}
        <TabsContent value="bookings" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking List</CardTitle>
              <CardDescription>
                Manage and track all restaurant reservations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(booking.status)}
                        <div
                          className={`w-3 h-3 rounded-full ${statusColors[booking.status as keyof typeof statusColors]}`}
                        ></div>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <h3 className="font-semibold">
                            {booking.customerName}
                          </h3>
                          <Badge variant="outline">
                            {booking.bookingNumber}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {booking.tableName} • {booking.partySize} guests •{" "}
                          {format(booking.bookingDate, "MMM dd")} at{" "}
                          {booking.bookingTime}
                        </p>
                        <div className="flex items-center space-x-4 mt-1">
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Phone className="h-3 w-3 mr-1" />
                            {booking.customerPhone}
                          </span>
                          <span className="text-xs text-muted-foreground flex items-center">
                            <Mail className="h-3 w-3 mr-1" />
                            {booking.customerEmail}
                          </span>
                          {booking.occasion && (
                            <Badge variant="secondary" className="text-xs">
                              {booking.occasion}
                            </Badge>
                          )}
                        </div>
                        {booking.specialRequests && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Special: {booking.specialRequests}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Badge
                        variant={
                          booking.status === "confirmed" ||
                          booking.status === "seated"
                            ? "default"
                            : "secondary"
                        }
                      >
                        {booking.status.replace("_", " ")}
                      </Badge>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(booking.id, "confirmed")
                            }
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Confirm
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(booking.id, "seated")
                            }
                          >
                            <UserCheck className="h-4 w-4 mr-2" />
                            Mark Seated
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(booking.id, "completed")
                            }
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Complete
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedBooking(booking);
                              setIsEditDialogOpen(true);
                            }}
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              handleStatusChange(booking.id, "cancelled")
                            }
                            className="text-red-600"
                          >
                            <XCircle className="h-4 w-4 mr-2" />
                            Cancel
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Table Management */}
        <TabsContent value="tables" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Table Configuration</CardTitle>
              <CardDescription>
                Manage table layout and availability
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {mockTables.map((table) => (
                  <div key={table.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-semibold">{table.tableNumber}</h3>
                      <Badge
                        variant={table.type === "vip" ? "default" : "secondary"}
                      >
                        {table.type}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm text-muted-foreground">
                      <p>Capacity: {table.capacity} guests</p>
                      <p>Location: {table.location}</p>
                      <p className="text-green-600">Available</p>
                    </div>
                    <div className="flex space-x-2 mt-3">
                      <Button variant="outline" size="sm">
                        <Edit className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Calendar View */}
        <TabsContent value="calendar" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Booking Calendar</CardTitle>
              <CardDescription>
                Visual overview of all bookings by date
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <CalendarSchedule className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Calendar view will show booking schedule</p>
                <p className="text-sm">Integration with calendar component</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

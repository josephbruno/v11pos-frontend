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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import {
  CalendarIcon,
  Clock,
  Users,
  MapPin,
  CheckCircle2,
  AlertTriangle,
  Info,
  Star,
  Utensils,
  Car,
  Wifi,
  CreditCard,
  Phone,
  Mail,
  Calendar as CalendarSchedule,
} from "lucide-react";

// Mock data for available time slots
const mockTimeSlots = [
  { time: "17:00", available: true, popular: false },
  { time: "17:30", available: true, popular: true },
  { time: "18:00", available: true, popular: true },
  { time: "18:30", available: false, popular: true },
  { time: "19:00", available: true, popular: true },
  { time: "19:30", available: false, popular: true },
  { time: "20:00", available: true, popular: true },
  { time: "20:30", available: true, popular: false },
  { time: "21:00", available: true, popular: false },
  { time: "21:30", available: true, popular: false },
];

const mockTables = [
  {
    id: "table-1",
    name: "Cozy Corner",
    capacity: 4,
    location: "Main Dining",
    type: "regular",
    amenities: ["window_view"],
    price: 0,
    image: "https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=300&h=200&fit=crop",
  },
  {
    id: "table-2",
    name: "Garden View",
    capacity: 6,
    location: "Terrace",
    type: "outdoor",
    amenities: ["outdoor_seating", "garden_view"],
    price: 10,
    image: "https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=300&h=200&fit=crop",
  },
  {
    id: "table-3",
    name: "Private Dining",
    capacity: 8,
    location: "Private Room",
    type: "private",
    amenities: ["private_room", "tv_screen", "audio_system"],
    price: 25,
    image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=300&h=200&fit=crop",
  },
  {
    id: "table-4",
    name: "VIP Booth",
    capacity: 4,
    location: "VIP Section",
    type: "vip",
    amenities: ["premium_seating", "dedicated_service", "champagne_service"],
    price: 15,
    image: "https://images.unsplash.com/photo-1514933651103-005eec06c04b?w=300&h=200&fit=crop",
  },
];

const amenityIcons = {
  window_view: MapPin,
  outdoor_seating: Utensils,
  garden_view: MapPin,
  private_room: Users,
  tv_screen: Star,
  audio_system: Star,
  premium_seating: Star,
  dedicated_service: Star,
  champagne_service: Star,
  parking: Car,
  wifi: Wifi,
};

export default function CustomerBooking() {
  const [step, setStep] = useState(1);
  const [selectedDate, setSelectedDate] = useState<Date>();
  const [selectedTime, setSelectedTime] = useState("");
  const [partySize, setPartySize] = useState(2);
  const [selectedTable, setSelectedTable] = useState("");
  const [bookingData, setBookingData] = useState({
    customerName: "",
    customerEmail: "",
    customerPhone: "",
    specialRequests: "",
    occasion: "",
  });

  const availableTables = mockTables.filter(table => table.capacity >= partySize);

  const handleNextStep = () => {
    if (step < 4) setStep(step + 1);
  };

  const handlePrevStep = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleBookingSubmit = () => {
    const booking = {
      ...bookingData,
      date: selectedDate,
      time: selectedTime,
      partySize,
      tableId: selectedTable,
    };
    console.log("Submitting booking:", booking);
    setStep(5); // Confirmation step
  };

  const getStepTitle = () => {
    switch (step) {
      case 1: return "Select Date & Time";
      case 2: return "Choose Table";
      case 3: return "Your Information";
      case 4: return "Review & Confirm";
      case 5: return "Booking Confirmed";
      default: return "Book a Table";
    }
  };

  const isNextDisabled = () => {
    switch (step) {
      case 1: return !selectedDate || !selectedTime;
      case 2: return !selectedTable;
      case 3: return !bookingData.customerName || !bookingData.customerEmail || !bookingData.customerPhone;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      <div className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="max-w-4xl mx-auto"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-foreground mb-2">
              Reserve Your Table
            </h1>
            <p className="text-xl text-muted-foreground">
              Experience exceptional dining with us
            </p>
          </div>

          {/* Progress Steps */}
          {step < 5 && (
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-4">
                {[1, 2, 3, 4].map((stepNumber) => (
                  <div key={stepNumber} className="flex items-center">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium ${
                        stepNumber <= step
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {stepNumber}
                    </div>
                    {stepNumber < 4 && (
                      <div
                        className={`w-16 h-1 ${
                          stepNumber < step ? "bg-primary" : "bg-muted"
                        }`}
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">{getStepTitle()}</CardTitle>
              {step < 5 && (
                <CardDescription>
                  Step {step} of 4
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="p-8">
              {/* Step 1: Date & Time Selection */}
              {step === 1 && (
                <div className="space-y-8">
                  <div>
                    <Label className="text-lg font-medium mb-4 block">Party Size</Label>
                    <Select value={partySize.toString()} onValueChange={(value) => setPartySize(parseInt(value))}>
                      <SelectTrigger className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[1,2,3,4,5,6,7,8,9,10,12,15,20].map((size) => (
                          <SelectItem key={size} value={size.toString()}>
                            {size} {size === 1 ? "person" : "people"}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div>
                      <Label className="text-lg font-medium mb-4 block">Select Date</Label>
                      <Calendar
                        mode="single"
                        selected={selectedDate}
                        onSelect={setSelectedDate}
                        disabled={(date) => date < new Date() || date.getDay() === 0}
                        className="rounded-md border shadow w-full"
                      />
                    </div>

                    <div>
                      <Label className="text-lg font-medium mb-4 block">Available Times</Label>
                      {selectedDate ? (
                        <div className="grid grid-cols-2 gap-3">
                          {mockTimeSlots.map((slot) => (
                            <Button
                              key={slot.time}
                              variant={selectedTime === slot.time ? "default" : "outline"}
                              className="h-12 relative"
                              disabled={!slot.available}
                              onClick={() => setSelectedTime(slot.time)}
                            >
                              <div className="flex items-center space-x-2">
                                <Clock className="h-4 w-4" />
                                <span>{slot.time}</span>
                                {slot.popular && (
                                  <Star className="h-3 w-3 text-yellow-500" />
                                )}
                              </div>
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-8 text-muted-foreground">
                          <CalendarSchedule className="h-12 w-12 mx-auto mb-2 opacity-50" />
                          <p>Please select a date first</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Table Selection */}
              {step === 2 && (
                <div className="space-y-6">
                  <div className="text-center">
                    <p className="text-muted-foreground">
                      {format(selectedDate!, "EEEE, MMMM do")} at {selectedTime} for {partySize} guests
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {availableTables.map((table) => (
                      <Card
                        key={table.id}
                        className={`cursor-pointer transition-all hover:scale-105 ${
                          selectedTable === table.id 
                            ? "ring-2 ring-primary shadow-lg" 
                            : "hover:shadow-md"
                        }`}
                        onClick={() => setSelectedTable(table.id)}
                      >
                        <div className="aspect-video relative overflow-hidden rounded-t-lg">
                          <img
                            src={table.image}
                            alt={table.name}
                            className="w-full h-full object-cover"
                          />
                          {table.price > 0 && (
                            <Badge className="absolute top-2 right-2">
                              +${table.price}/person
                            </Badge>
                          )}
                          <Badge 
                            variant={table.type === "vip" ? "default" : "secondary"}
                            className="absolute top-2 left-2"
                          >
                            {table.type.toUpperCase()}
                          </Badge>
                        </div>
                        <CardContent className="p-4">
                          <div className="space-y-2">
                            <h3 className="font-semibold text-lg">{table.name}</h3>
                            <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Users className="h-4 w-4" />
                                <span>Up to {table.capacity} guests</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <MapPin className="h-4 w-4" />
                                <span>{table.location}</span>
                              </div>
                            </div>
                            <div className="flex flex-wrap gap-1 mt-2">
                              {table.amenities.map((amenity) => {
                                const IconComponent = amenityIcons[amenity as keyof typeof amenityIcons] || Info;
                                return (
                                  <Badge key={amenity} variant="outline" className="text-xs">
                                    <IconComponent className="h-3 w-3 mr-1" />
                                    {amenity.replace("_", " ")}
                                  </Badge>
                                );
                              })}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              {/* Step 3: Customer Information */}
              {step === 3 && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="customer-name">Full Name *</Label>
                      <Input
                        id="customer-name"
                        value={bookingData.customerName}
                        onChange={(e) => setBookingData(prev => ({ ...prev, customerName: e.target.value }))}
                        placeholder="Enter your full name"
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="customer-phone">Phone Number *</Label>
                      <Input
                        id="customer-phone"
                        value={bookingData.customerPhone}
                        onChange={(e) => setBookingData(prev => ({ ...prev, customerPhone: e.target.value }))}
                        placeholder="Enter your phone number"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="customer-email">Email Address *</Label>
                    <Input
                      id="customer-email"
                      type="email"
                      value={bookingData.customerEmail}
                      onChange={(e) => setBookingData(prev => ({ ...prev, customerEmail: e.target.value }))}
                      placeholder="Enter your email address"
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="occasion">Occasion (Optional)</Label>
                    <Select
                      value={bookingData.occasion}
                      onValueChange={(value) => setBookingData(prev => ({ ...prev, occasion: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="What's the occasion?" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="general">General Dining</SelectItem>
                        <SelectItem value="birthday">Birthday Celebration</SelectItem>
                        <SelectItem value="anniversary">Anniversary</SelectItem>
                        <SelectItem value="date">Date Night</SelectItem>
                        <SelectItem value="business">Business Meeting</SelectItem>
                        <SelectItem value="celebration">Special Celebration</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="special-requests">Special Requests (Optional)</Label>
                    <Textarea
                      id="special-requests"
                      value={bookingData.specialRequests}
                      onChange={(e) => setBookingData(prev => ({ ...prev, specialRequests: e.target.value }))}
                      placeholder="Any dietary restrictions, accessibility needs, or special requests..."
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {/* Step 4: Review & Confirm */}
              {step === 4 && (
                <div className="space-y-6 max-w-2xl mx-auto">
                  <div className="text-center">
                    <h3 className="text-xl font-semibold mb-2">Review Your Booking</h3>
                    <p className="text-muted-foreground">Please review the details below</p>
                  </div>

                  <Card className="p-6">
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span className="font-medium">Date & Time:</span>
                        <span>{format(selectedDate!, "EEEE, MMMM do")} at {selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Party Size:</span>
                        <span>{partySize} guests</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Table:</span>
                        <span>{mockTables.find(t => t.id === selectedTable)?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Name:</span>
                        <span>{bookingData.customerName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Phone:</span>
                        <span>{bookingData.customerPhone}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="font-medium">Email:</span>
                        <span>{bookingData.customerEmail}</span>
                      </div>
                      {bookingData.occasion && (
                        <div className="flex justify-between">
                          <span className="font-medium">Occasion:</span>
                          <span>{bookingData.occasion}</span>
                        </div>
                      )}
                      {bookingData.specialRequests && (
                        <div>
                          <span className="font-medium">Special Requests:</span>
                          <p className="text-sm text-muted-foreground mt-1">{bookingData.specialRequests}</p>
                        </div>
                      )}
                    </div>
                  </Card>

                  <Card className="p-4 bg-blue-50 dark:bg-blue-950">
                    <div className="flex items-start space-x-3">
                      <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                      <div className="text-sm">
                        <p className="font-medium text-blue-900 dark:text-blue-100">Important Information:</p>
                        <ul className="text-blue-800 dark:text-blue-200 mt-1 space-y-1">
                          <li>• Please arrive 15 minutes before your reservation time</li>
                          <li>• Cancellations must be made at least 2 hours in advance</li>
                          <li>• Tables are held for 15 minutes past reservation time</li>
                        </ul>
                      </div>
                    </div>
                  </Card>
                </div>
              )}

              {/* Step 5: Confirmation */}
              {step === 5 && (
                <div className="text-center space-y-6">
                  <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 className="h-10 w-10 text-green-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-green-600 mb-2">
                      Booking Confirmed!
                    </h3>
                    <p className="text-muted-foreground">
                      Your table reservation has been successfully created.
                    </p>
                  </div>

                  <Card className="p-6 max-w-md mx-auto">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Booking ID:</span>
                        <span className="font-mono">BK-2024-005</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Date:</span>
                        <span>{format(selectedDate!, "MMM dd, yyyy")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Time:</span>
                        <span>{selectedTime}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Guests:</span>
                        <span>{partySize}</span>
                      </div>
                    </div>
                  </Card>

                  <div className="space-y-3">
                    <p className="text-sm text-muted-foreground">
                      A confirmation email has been sent to {bookingData.customerEmail}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                      <Button variant="outline">
                        <Mail className="h-4 w-4 mr-2" />
                        Resend Email
                      </Button>
                      <Button variant="outline">
                        <Phone className="h-4 w-4 mr-2" />
                        Call Restaurant
                      </Button>
                    </div>
                  </div>
                </div>
              )}

              {/* Navigation Buttons */}
              {step < 5 && (
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={handlePrevStep}
                    disabled={step === 1}
                  >
                    Previous
                  </Button>
                  
                  {step < 4 ? (
                    <Button
                      onClick={handleNextStep}
                      disabled={isNextDisabled()}
                    >
                      Next Step
                    </Button>
                  ) : (
                    <Button
                      onClick={handleBookingSubmit}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Confirm Booking
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}

// Shared API types between client and server

export interface DemoResponse {
  message: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'super_admin' | 'admin' | 'manager' | 'staff' | 'cashier';
  status?: string;
  avatar?: string | null;
  permissions?: string[];
  join_date?: string;
  created_at?: string;
  updated_at?: string;
  organizationId?: string;
  branchId?: string;
}

export interface LoginResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface TableBooking {
  id: string;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  tableId: string;
  partySize: number;
  bookingDate: Date;
  bookingTime: string;
  duration: number;
  status: 'pending' | 'confirmed' | 'seated' | 'completed' | 'cancelled' | 'no_show';
  occasion?: string;
  specialRequests?: string;
  source: 'online' | 'phone' | 'admin' | 'walk_in';
  seatedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

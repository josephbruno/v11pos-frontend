export type BookingStatus =
  | "pending"
  | "confirmed"
  | "seated"
  | "completed"
  | "cancelled"
  | "no_show";

export type TableBooking = {
  id: string;
  tableId: string;
  bookingNumber: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  tableName: string;
  partySize: number;
  bookingDate: Date;
  bookingTime: string;
  duration: number;
  status: BookingStatus;
  occasion: string;
  specialRequests: string;
  source: string;
  createdAt: Date;
};

export type CreateTableBookingInput = {
  tableId: string;
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  partySize: number;
  bookingDate: Date;
  bookingTime: string;
  occasion?: string;
  specialRequests?: string;
};

export type TableStatistics = {
  totalTables: number;
  availableTables: number;
  occupiedTables: number;
  reservedTables: number;
  totalCapacity: number;
  occupancyRate: number;
};

const BOOKING_NOTES_PREFIX = "swiftpos_booking:";

function dateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseBookingStatus(value: unknown): BookingStatus {
  const status = String(value || "").toLowerCase();
  if (
    status === "pending" ||
    status === "confirmed" ||
    status === "seated" ||
    status === "completed" ||
    status === "cancelled" ||
    status === "no_show"
  ) {
    return status;
  }
  return "confirmed";
}

function decodeBookingNotes(notes: unknown): Record<string, unknown> | null {
  if (typeof notes !== "string" || !notes.startsWith(BOOKING_NOTES_PREFIX)) {
    return null;
  }
  try {
    return JSON.parse(notes.slice(BOOKING_NOTES_PREFIX.length)) as Record<
      string,
      unknown
    >;
  } catch {
    return null;
  }
}

export function encodeBookingNotes(
  input: CreateTableBookingInput,
  status: BookingStatus = "confirmed",
): string {
  const payload = {
    customer_name: input.customerName,
    customer_phone: input.customerPhone,
    customer_email: input.customerEmail,
    party_size: input.partySize,
    booking_date: dateOnly(input.bookingDate),
    booking_time: input.bookingTime,
    occasion: input.occasion,
    special_requests: input.specialRequests,
    booking_status: status,
  };
  return `${BOOKING_NOTES_PREFIX}${JSON.stringify(payload)}`;
}

export function encodeBookingStatusUpdate(
  booking: TableBooking,
  status: BookingStatus,
): string {
  const payload = {
    customer_name: booking.customerName,
    customer_phone: booking.customerPhone || undefined,
    customer_email: booking.customerEmail || undefined,
    party_size: booking.partySize,
    booking_date: dateOnly(booking.bookingDate),
    booking_time: booking.bookingTime,
    occasion: booking.occasion || undefined,
    special_requests: booking.specialRequests || undefined,
    booking_status: status,
  };
  return `${BOOKING_NOTES_PREFIX}${JSON.stringify(payload)}`;
}

export function tableToBooking(table: any): TableBooking | null {
  const tableId = String(table?.id ?? table?.table_id ?? table?.tableId ?? "");
  if (!tableId) return null;

  const tableStatus = String(table?.status ?? "").toLowerCase();
  const meta = decodeBookingNotes(table?.notes);

  if (!meta && tableStatus !== "reserved") {
    return null;
  }

  const tableNumber = String(
    table?.table_number ??
      table?.tableNumber ??
      table?.table_name ??
      table?.tableName ??
      "",
  );
  const tableName = String(
    table?.table_name ?? table?.tableName ?? tableNumber ?? "Table",
  );
  const bookingDateRaw = meta?.booking_date;
  const createdAtRaw = table?.created_at ?? table?.createdAt;
  const bookingDate = bookingDateRaw
    ? new Date(String(bookingDateRaw))
    : createdAtRaw
      ? new Date(String(createdAtRaw))
      : new Date();

  const bookingStatus = parseBookingStatus(meta?.booking_status);
  const status: BookingStatus =
    tableStatus === "occupied" && bookingStatus !== "completed"
      ? "seated"
      : bookingStatus;

  return {
    id: tableId,
    tableId,
    bookingNumber: `BK-${tableNumber.padStart(3, "0")}`,
    customerName: String(meta?.customer_name ?? "Reserved guest"),
    customerEmail: String(meta?.customer_email ?? ""),
    customerPhone: String(meta?.customer_phone ?? ""),
    tableName,
    partySize: Number(meta?.party_size ?? table?.capacity ?? 0) || 1,
    bookingDate,
    bookingTime: String(meta?.booking_time ?? "--:--"),
    duration: 120,
    status,
    occasion: String(meta?.occasion ?? ""),
    specialRequests: String(meta?.special_requests ?? ""),
    source: "admin",
    createdAt: createdAtRaw ? new Date(String(createdAtRaw)) : bookingDate,
  };
}

export function normalizeTablesResponse(payload: any): any[] {
  const source =
    payload?.data?.data?.tables ??
    payload?.data?.tables ??
    payload?.data?.data ??
    payload?.data?.items ??
    payload?.data ??
    payload;
  return Array.isArray(source) ? source : [];
}

export function normalizeTableStatistics(payload: any): TableStatistics | null {
  const stats = payload?.data?.data ?? payload?.data ?? payload;
  if (!stats || typeof stats !== "object") return null;

  return {
    totalTables: Number(stats.total_tables ?? stats.totalTables ?? 0),
    availableTables: Number(stats.available_tables ?? stats.availableTables ?? 0),
    occupiedTables: Number(stats.occupied_tables ?? stats.occupiedTables ?? 0),
    reservedTables: Number(stats.reserved_tables ?? stats.reservedTables ?? 0),
    totalCapacity: Number(stats.total_capacity ?? stats.totalCapacity ?? 0),
    occupancyRate: Number(stats.occupancy_rate ?? stats.occupancyRate ?? 0),
  };
}

export type MappedTable = {
  id: string;
  tableNumber: string;
  tableName: string;
  capacity: number;
  minCapacity?: number;
  location: string;
  floor: string;
  section: string;
  type: string;
  isActive: boolean;
  isBookable: boolean;
  status: string;
  notes: string;
  image?: string;
  description?: string;
  updatedAt?: Date;
  createdAt?: Date;
};

export type OccupiedTableDetail = MappedTable & {
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  partySize: number;
  bookingTime: string;
  occasion: string;
  specialRequests: string;
  source: "reservation" | "walk-in";
};

export function mapTableRecord(table: any): MappedTable {
  const section = String(table.section ?? "");
  const floor = String(table.floor ?? "");
  const location = String(
    table.location ?? section ?? floor ?? table.area ?? "",
  );

  return {
    id: String(table.id ?? table.table_id ?? table.tableId ?? ""),
    tableNumber: String(
      table.table_number ??
        table.tableNumber ??
        table.table_name ??
        table.tableName ??
        table.name ??
        "",
    ),
    tableName: String(table.table_name ?? table.tableName ?? ""),
    capacity: Number(table.capacity ?? table.seats ?? 0),
    minCapacity: table.min_capacity ?? table.minCapacity ?? undefined,
    location,
    floor,
    section,
    type: table.is_outdoor || table.isOutdoor
      ? "outdoor"
      : String(table.type ?? table.table_type ?? "regular"),
    isActive: table.is_active ?? table.isActive ?? true,
    isBookable: table.is_bookable ?? table.isBookable ?? true,
    status: String(table.status ?? ""),
    notes: table.notes ?? "",
    image: table.image ?? undefined,
    description: table.description ?? undefined,
    updatedAt: table.updated_at
      ? new Date(String(table.updated_at))
      : table.updatedAt
        ? new Date(String(table.updatedAt))
        : undefined,
    createdAt: table.created_at
      ? new Date(String(table.created_at))
      : table.createdAt
        ? new Date(String(table.createdAt))
        : undefined,
  };
}

export function tableToOccupiedDetail(table: any): OccupiedTableDetail | null {
  const mapped = mapTableRecord(table);
  if (mapped.status.toLowerCase() !== "occupied") {
    return null;
  }

  const booking = tableToBooking(table);
  const meta = decodeBookingNotes(table?.notes);

  return {
    ...mapped,
    customerName: booking?.customerName ?? "Walk-in guest",
    customerPhone: booking?.customerPhone ?? "",
    customerEmail: booking?.customerEmail ?? "",
    partySize: booking?.partySize ?? mapped.capacity,
    bookingTime: booking?.bookingTime ?? "",
    occasion: booking?.occasion ?? "",
    specialRequests: booking?.specialRequests ?? "",
    source: meta ? "reservation" : "walk-in",
  };
}

export function bookingStatusToTableUpdate(
  booking: TableBooking,
  status: BookingStatus,
): { status: string; notes: string } {
  if (status === "completed" || status === "cancelled" || status === "no_show") {
    return { status: "available", notes: "" };
  }

  const tableStatus =
    status === "seated"
      ? "occupied"
      : status === "pending" || status === "confirmed"
        ? "reserved"
        : "reserved";

  return {
    status: tableStatus,
    notes: encodeBookingStatusUpdate(booking, status),
  };
}

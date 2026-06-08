import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Clock, Calendar, Plus, Trash2, LogIn, LogOut } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  clockStaff,
  createStaffMember,
  deleteStaffMember,
  getStaffAttendance,
  getStaffMembers,
  getStaffRoles,
  getStaffShifts,
} from "@/lib/apiServices";
import type { StaffMember } from "@/shared/api";

function unwrapList(res: unknown): any[] {
  const r = res as { data?: unknown };
  const src = r?.data ?? res;
  return Array.isArray(src) ? src : [];
}

const emptyForm = {
  employee_code: "",
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  role_id: "",
  date_of_joining: new Date().toISOString().split("T")[0],
};

export default function StaffManagement() {
  const { user } = useAuth();
  const { addToast } = useToast();
  const queryClient = useQueryClient();
  const restaurantId = user?.branchId ?? "";
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const { data: membersRaw, isLoading } = useQuery({
    queryKey: ["staffMembers", restaurantId],
    queryFn: () => getStaffMembers(restaurantId),
    enabled: !!restaurantId,
  });

  const { data: rolesRaw } = useQuery({
    queryKey: ["staffRoles", restaurantId],
    queryFn: () => getStaffRoles(restaurantId),
    enabled: !!restaurantId,
  });

  const { data: attendanceRaw } = useQuery({
    queryKey: ["staffAttendance", restaurantId],
    queryFn: () => getStaffAttendance(restaurantId),
    enabled: !!restaurantId,
  });

  const { data: shiftsRaw } = useQuery({
    queryKey: ["staffShifts", restaurantId],
    queryFn: () => getStaffShifts(restaurantId),
    enabled: !!restaurantId,
  });

  const members = useMemo(() => unwrapList(membersRaw), [membersRaw]);
  const roles = useMemo(() => unwrapList(rolesRaw), [rolesRaw]);
  const attendance = useMemo(() => unwrapList(attendanceRaw), [attendanceRaw]);
  const shifts = useMemo(() => unwrapList(shiftsRaw), [shiftsRaw]);

  const createMutation = useMutation({
    mutationFn: () =>
      createStaffMember({
        ...form,
        restaurant_id: restaurantId,
      } as Partial<StaffMember>),
    onSuccess: () => {
      addToast({ title: "Staff member created", type: "success" });
      setOpen(false);
      setForm(emptyForm);
      queryClient.invalidateQueries({ queryKey: ["staffMembers", restaurantId] });
    },
    onError: (err: Error) => addToast({ title: err.message, type: "error" }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteStaffMember(id),
    onSuccess: () => {
      addToast({ title: "Staff member removed", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["staffMembers", restaurantId] });
    },
    onError: (err: Error) => addToast({ title: err.message, type: "error" }),
  });

  const clockMutation = useMutation({
    mutationFn: ({ staffId, action, attendanceId }: { staffId: string; action: "clock_in" | "clock_out"; attendanceId?: string }) =>
      clockStaff(restaurantId, staffId, action, attendanceId),
    onSuccess: () => {
      addToast({ title: "Attendance updated", type: "success" });
      queryClient.invalidateQueries({ queryKey: ["staffAttendance", restaurantId] });
    },
    onError: (err: Error) => addToast({ title: err.message, type: "error" }),
  });

  if (!restaurantId) {
    return <div className="p-6 text-muted-foreground">No restaurant selected.</div>;
  }

  return (
    <div className="p-4 md:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Users className="h-7 w-7" />
            Staff & HR
          </h1>
          <p className="text-muted-foreground text-sm">Members, attendance, and shifts</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add staff
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New staff member</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <Label>Employee code</Label>
                <Input value={form.employee_code} onChange={(e) => setForm({ ...form, employee_code: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>First name</Label>
                  <Input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
                </div>
                <div>
                  <Label>Last name</Label>
                  <Input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
                </div>
              </div>
              <div>
                <Label>Phone</Label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              </div>
              <div>
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <Label>Role</Label>
                <Select value={form.role_id} onValueChange={(v) => setForm({ ...form, role_id: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select role" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((r: any) => (
                      <SelectItem key={r.id} value={String(r.id)}>
                        {r.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Date of joining</Label>
                <Input type="date" value={form.date_of_joining} onChange={(e) => setForm({ ...form, date_of_joining: e.target.value })} />
              </div>
              <Button className="w-full" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="attendance">Attendance</TabsTrigger>
          <TabsTrigger value="shifts">Shifts</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-3 mt-4">
          {isLoading && <p className="text-muted-foreground">Loading...</p>}
          {members.map((m: any) => (
            <Card key={m.id}>
              <CardContent className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="font-medium">
                    {m.first_name} {m.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {m.employee_code} · {m.phone}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={m.is_active !== false ? "default" : "secondary"}>
                    {m.is_active !== false ? "Active" : "Inactive"}
                  </Badge>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => clockMutation.mutate({ staffId: m.id, action: "clock_in" })}
                  >
                    <LogIn className="h-3 w-3 mr-1" />
                    In
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      const open = attendance.find(
                        (a: any) => a.staff_id === m.id && !a.check_out_time,
                      );
                      clockMutation.mutate({
                        staffId: m.id,
                        action: "clock_out",
                        attendanceId: open?.id,
                      });
                    }}
                  >
                    <LogOut className="h-3 w-3 mr-1" />
                    Out
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteMutation.mutate(m.id)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {members.length === 0 && !isLoading && (
            <p className="text-muted-foreground text-center py-8">No staff members yet.</p>
          )}
        </TabsContent>

        <TabsContent value="attendance" className="mt-4 space-y-2">
          {attendance.map((a: any) => (
            <Card key={a.id}>
              <CardContent className="p-4 flex justify-between text-sm">
                <span>
                  <Clock className="inline h-4 w-4 mr-1" />
                  Staff {a.staff_id?.slice(-6)}
                </span>
                <span>
                  {a.check_in_time ? new Date(a.check_in_time).toLocaleString() : "–"}
                  {a.check_out_time ? ` → ${new Date(a.check_out_time).toLocaleString()}` : " (open)"}
                </span>
                <Badge>{a.status ?? "present"}</Badge>
              </CardContent>
            </Card>
          ))}
          {attendance.length === 0 && (
            <p className="text-muted-foreground text-center py-8">No attendance records.</p>
          )}
        </TabsContent>

        <TabsContent value="shifts" className="mt-4 space-y-2">
          {shifts.map((s: any) => (
            <Card key={s.id}>
              <CardHeader className="py-3">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {s.name ?? s.shift_type ?? "Shift"}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 text-sm text-muted-foreground">
                {s.start_time} – {s.end_time}
              </CardContent>
            </Card>
          ))}
          {shifts.length === 0 && (
            <p className="text-muted-foreground text-center py-8">No shifts configured.</p>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

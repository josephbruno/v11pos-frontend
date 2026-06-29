import { useEffect, useRef, useState } from "react";
import { Image as ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { validateImageFile } from "@/lib/imageCropConfig";
import type { QRTable } from "@/shared/api";
import { resolveTableImageSrc } from "./qrUtils";
import type { EditTableFormValues } from "./constants";

interface EditTableFormProps {
  restaurantId: string;
  table?: QRTable;
  onSave: (table: EditTableFormValues) => void;
  onCancel: () => void;
}

export function EditTableForm({ restaurantId, table, onSave, onCancel }: EditTableFormProps) {
  const [formData, setFormData] = useState<EditTableFormValues>({
    restaurant_id: String((table as any)?.restaurant_id ?? restaurantId ?? ""),
    table_number: String((table as any)?.table_number ?? table?.tableNumber ?? ""),
    table_name: String((table as any)?.table_name ?? table?.tableName ?? ""),
    capacity: Number((table as any)?.capacity ?? table?.capacity ?? 4),
    min_capacity: (table as any)?.min_capacity ?? (table as any)?.minCapacity ?? "",
    floor: String((table as any)?.floor ?? ""),
    section: String((table as any)?.section ?? (table as any)?.location ?? table?.location ?? ""),
    position_x: (table as any)?.position_x ?? (table as any)?.positionX ?? "",
    position_y: (table as any)?.position_y ?? (table as any)?.positionY ?? "",
    image: String((table as any)?.image ?? ""),
    qr_code: String((table as any)?.qr_code ?? (table as any)?.qrCode ?? ""),
    status: String((table as any)?.status ?? "available"),
    is_bookable: (table as any)?.is_bookable ?? (table as any)?.isBookable ?? true,
    is_outdoor: (table as any)?.is_outdoor ?? (table as any)?.isOutdoor ?? false,
    is_accessible: (table as any)?.is_accessible ?? (table as any)?.isAccessible ?? false,
    has_power_outlet: (table as any)?.has_power_outlet ?? (table as any)?.hasPowerOutlet ?? false,
    minimum_spend: (table as any)?.minimum_spend ?? (table as any)?.minimumSpend ?? "",
    description: String((table as any)?.description ?? ""),
    notes: String((table as any)?.notes ?? ""),
    is_active: (table as any)?.is_active ?? table?.isActive ?? true,
  });
  const [imagePreview, setImagePreview] = useState(
    table?.image ? resolveTableImageSrc(table.image) : ""
  );
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageError, setImageError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setFormData((prev) => ({
      ...prev,
      restaurant_id: String((table as any)?.restaurant_id ?? restaurantId ?? ""),
    }));
    if (table?.image) {
      setImagePreview(resolveTableImageSrc(table.image));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurantId, table?.id, table?.image]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file, "table");
      if (!validation.valid) {
        setImageError(validation.error || "Invalid image");
        return;
      }
      setImageError("");
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => onSave({ ...formData, image_file: imageFile });

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label className="text-foreground">Restaurant ID *</Label>
        <Input
          value={formData.restaurant_id}
          disabled
          className="bg-background border-border text-foreground"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="table-number" className="text-foreground">
            Table Number/Identifier *
          </Label>
          <Input
            id="table-number"
            value={formData.table_number}
            onChange={(e) =>
              setFormData((p) => ({ ...p, table_number: e.target.value }))
            }
            className="bg-background border-border text-foreground"
            placeholder="T-01"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="table-name" className="text-foreground">
            Table Name
          </Label>
          <Input
            id="table-name"
            value={formData.table_name}
            onChange={(e) =>
              setFormData((p) => ({ ...p, table_name: e.target.value }))
            }
            className="bg-background border-border text-foreground"
            placeholder="Optional name"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="capacity" className="text-foreground">
            Capacity *
          </Label>
          <Input
            id="capacity"
            type="number"
            inputMode="numeric"
            min={1}
            value={formData.capacity}
            onChange={(e) =>
              setFormData((p) => ({ ...p, capacity: Number(e.target.value || 0) }))
            }
            className="bg-background border-border text-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="min-capacity" className="text-foreground">
            Min Capacity
          </Label>
          <Input
            id="min-capacity"
            type="number"
            inputMode="numeric"
            min={0}
            value={String(formData.min_capacity)}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                min_capacity: e.target.value === "" ? "" : Number(e.target.value),
              }))
            }
            className="bg-background border-border text-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="floor" className="text-foreground">
            Floor
          </Label>
          <Input
            id="floor"
            value={formData.floor}
            onChange={(e) => setFormData((p) => ({ ...p, floor: e.target.value }))}
            className="bg-background border-border text-foreground"
            placeholder="e.g. Ground"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="section" className="text-foreground">
            Section
          </Label>
          <Input
            id="section"
            value={formData.section}
            onChange={(e) => setFormData((p) => ({ ...p, section: e.target.value }))}
            className="bg-background border-border text-foreground"
            placeholder='e.g. "Patio", "Main Hall"'
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="position-x" className="text-foreground">
            Position X
          </Label>
          <Input
            id="position-x"
            type="number"
            inputMode="numeric"
            value={String(formData.position_x)}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                position_x: e.target.value === "" ? "" : Number(e.target.value),
              }))
            }
            className="bg-background border-border text-foreground"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="position-y" className="text-foreground">
            Position Y
          </Label>
          <Input
            id="position-y"
            type="number"
            inputMode="numeric"
            value={String(formData.position_y)}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                position_y: e.target.value === "" ? "" : Number(e.target.value),
              }))
            }
            className="bg-background border-border text-foreground"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-foreground">Table Image</Label>
        <div className="flex items-start gap-4">
          <div className="w-32 h-32 border-2 border-dashed border-border rounded-md flex items-center justify-center overflow-hidden bg-muted">
            {imagePreview ? (
              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
            ) : (
              <ImageIcon className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 space-y-2">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => imageInputRef.current?.click()}
              className="w-full border-border text-foreground"
            >
              Choose Image
            </Button>
            <p className="text-xs text-muted-foreground">
              Recommended: Square image, max 2MB.
            </p>
          </div>
        </div>
        {imageError && <p className="text-xs text-destructive mt-1">{imageError}</p>}
      </div>

      <div className="space-y-2">
        <Label htmlFor="qr-code" className="text-foreground">
          QR Code URL
        </Label>
        <Input
          id="qr-code"
          value={formData.qr_code}
          onChange={(e) => setFormData((p) => ({ ...p, qr_code: e.target.value }))}
          className="bg-background border-border text-foreground"
          placeholder="https://..."
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label className="text-foreground">Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value) => setFormData((p) => ({ ...p, status: value }))}
          >
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="available">Available</SelectItem>
              <SelectItem value="occupied">Occupied</SelectItem>
              <SelectItem value="reserved">Reserved</SelectItem>
              <SelectItem value="cleaning">Cleaning</SelectItem>
              <SelectItem value="maintenance">Maintenance</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="minimum-spend" className="text-foreground">
            Minimum Spend
          </Label>
          <Input
            id="minimum-spend"
            type="number"
            inputMode="numeric"
            min={0}
            value={String(formData.minimum_spend)}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                minimum_spend: e.target.value === "" ? "" : Number(e.target.value),
              }))
            }
            className="bg-background border-border text-foreground"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <div className="text-sm font-medium text-foreground">Bookable</div>
            <div className="text-xs text-muted-foreground">Allow online booking</div>
          </div>
          <Switch
            checked={!!formData.is_bookable}
            onCheckedChange={(checked) => setFormData((p) => ({ ...p, is_bookable: checked }))}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <div className="text-sm font-medium text-foreground">Outdoor</div>
            <div className="text-xs text-muted-foreground">Outdoor table</div>
          </div>
          <Switch
            checked={!!formData.is_outdoor}
            onCheckedChange={(checked) => setFormData((p) => ({ ...p, is_outdoor: checked }))}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <div className="text-sm font-medium text-foreground">Accessible</div>
            <div className="text-xs text-muted-foreground">Wheelchair accessible</div>
          </div>
          <Switch
            checked={!!formData.is_accessible}
            onCheckedChange={(checked) => setFormData((p) => ({ ...p, is_accessible: checked }))}
          />
        </div>
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <div className="text-sm font-medium text-foreground">Power Outlet</div>
            <div className="text-xs text-muted-foreground">Has power outlet</div>
          </div>
          <Switch
            checked={!!formData.has_power_outlet}
            onCheckedChange={(checked) => setFormData((p) => ({ ...p, has_power_outlet: checked }))}
          />
        </div>
      </div>

      <div className="flex items-center justify-between rounded-lg border border-border p-3">
        <div>
          <div className="text-sm font-medium text-foreground">Active</div>
          <div className="text-xs text-muted-foreground">Enable this table</div>
        </div>
        <Switch
          checked={!!formData.is_active}
          onCheckedChange={(checked) => setFormData((p) => ({ ...p, is_active: checked }))}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-foreground">
          Description
        </Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
          className="bg-background border-border text-foreground"
          placeholder="Table description"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-foreground">
          Notes
        </Label>
        <Textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData((p) => ({ ...p, notes: e.target.value }))}
          className="bg-background border-border text-foreground"
          placeholder="Internal notes"
        />
      </div>

      <div className="flex items-center justify-end space-x-2 pt-4 border-t border-border">
        <Button
          variant="outline"
          onClick={onCancel}
          className="border-border text-muted-foreground hover:text-foreground"
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={!formData.table_number}
          className="bg-primary hover:bg-primary/90 text-primary-foreground"
        >
          {table ? "Update Table" : "Create Table"}
        </Button>
      </div>
    </div>
  );
}

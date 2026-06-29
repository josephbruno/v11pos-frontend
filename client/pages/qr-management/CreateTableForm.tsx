import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { validateImageFile } from "@/lib/imageCropConfig";

import { Image as ImageIcon } from "lucide-react";
import { Switch } from "@/components/ui/switch";

interface CreateTableFormProps {
  onSave: (table: any) => void;
  onCancel: () => void;
}

export function CreateTableForm({ onSave, onCancel }: CreateTableFormProps) {
  const [formData, setFormData] = useState({
    table_number: "",
    table_name: "",
    location: "Main Floor",
    capacity: 4,
    is_active: true,
  });
  const [imagePreview, setImagePreview] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateImageFile(file, "table");
      if (!validation.valid) {
        setError(validation.error || "Invalid image");
        return;
      }
      setError("");
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = () => {
    if (!formData.table_number) {
      setError("Table number is required");
      return;
    }
    onSave({ ...formData, image_file: imageFile });
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="table-number" className="text-foreground">
            Table Number *
          </Label>
          <Input
            id="table-number"
            value={formData.table_number}
            onChange={(e) => setFormData((p) => ({ ...p, table_number: e.target.value }))}
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
            onChange={(e) => setFormData((p) => ({ ...p, table_name: e.target.value }))}
            className="bg-background border-border text-foreground"
            placeholder="Table 1"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location" className="text-foreground">
            Location/Section
          </Label>
          <Select
            value={formData.location}
            onValueChange={(value) => setFormData((p) => ({ ...p, location: value }))}
          >
            <SelectTrigger className="bg-background border-border text-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              <SelectItem value="Main Floor">Main Floor</SelectItem>
              <SelectItem value="VIP Section">VIP Section</SelectItem>
              <SelectItem value="Outdoor">Outdoor</SelectItem>
              <SelectItem value="Private Dining">Private Dining</SelectItem>
              <SelectItem value="Bar Area">Bar Area</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity" className="text-foreground">
            Capacity (People)
          </Label>
          <Input
            id="capacity"
            type="number"
            min="1"
            max="20"
            value={formData.capacity}
            onChange={(e) =>
              setFormData((p) => ({
                ...p,
                capacity: parseInt(e.target.value) || 1,
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
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <div className="flex items-center space-x-3 p-4 bg-muted rounded-lg">
        <Switch
          checked={formData.is_active}
          onCheckedChange={(checked) => setFormData((p) => ({ ...p, is_active: checked }))}
        />
        <div>
          <Label className="text-foreground font-medium">
            Enable QR Ordering
          </Label>
          <p className="text-sm text-muted-foreground">
            Allow customers to scan and order from this table
          </p>
        </div>
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
          Create Table
        </Button>
      </div>
    </div>
  );
}

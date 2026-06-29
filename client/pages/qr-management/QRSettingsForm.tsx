import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/contexts/ToastContext";
import { mockQRSettings } from "./constants";

export function QRSettingsForm() {
  const [settings, setSettings] = useState(mockQRSettings);
  const { addToast } = useToast();

  const handleSave = () => {
    addToast({
      type: "success",
      title: "Settings Saved",
      description: "QR ordering settings updated successfully",
    });
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">General Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="text-foreground">Restaurant Name</Label>
              <Input
                value={settings.restaurantName}
                onChange={(e) =>
                  setSettings({ ...settings, restaurantName: e.target.value })
                }
                className="bg-background border-border text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-foreground">Service Charge (%)</Label>
              <Input
                type="number"
                value={settings.serviceChargePercentage}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    serviceChargePercentage: parseFloat(e.target.value) || 0,
                  })
                }
                className="bg-background border-border text-foreground"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-foreground">Welcome Message</Label>
            <Textarea
              value={settings.welcomeMessage}
              onChange={(e) =>
                setSettings({ ...settings, welcomeMessage: e.target.value })
              }
              className="bg-background border-border text-foreground"
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardHeader>
          <CardTitle className="text-foreground">Feature Toggles</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="font-medium text-foreground">
                  Online Ordering
                </div>
                <div className="text-sm text-muted-foreground">
                  Allow customers to place orders via QR
                </div>
              </div>
              <Switch
                checked={settings.enableOnlineOrdering}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableOnlineOrdering: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="font-medium text-foreground">Pay at Table</div>
                <div className="text-sm text-muted-foreground">
                  Allow customers to pay later
                </div>
              </div>
              <Switch
                checked={settings.enablePaymentAtTable}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enablePaymentAtTable: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="font-medium text-foreground">
                  Online Payment
                </div>
                <div className="text-sm text-muted-foreground">
                  Enable online payment gateways
                </div>
              </div>
              <Switch
                checked={settings.enableOnlinePayment}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableOnlinePayment: checked })
                }
              />
            </div>

            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <div>
                <div className="font-medium text-foreground">
                  Order Tracking
                </div>
                <div className="text-sm text-muted-foreground">
                  Real-time order status updates
                </div>
              </div>
              <Switch
                checked={settings.enableOrderTracking}
                onCheckedChange={(checked) =>
                  setSettings({ ...settings, enableOrderTracking: checked })
                }
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Button
        onClick={handleSave}
        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground"
      >
        Save QR Settings
      </Button>
    </div>
  );
}

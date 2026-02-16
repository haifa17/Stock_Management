"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import axios from "axios";
import { toast } from "react-toastify";

interface WhatsAppSettingsFormProps {
  initialData: {
    phone: string;
    receiveNotifications: boolean;
  };
}

export default function WhatsAppSettingsForm({
  initialData,
}: WhatsAppSettingsFormProps) {
  const router = useRouter();
  const [formData, setFormData] = useState(initialData);
  const [saving, setSaving] = useState(false);
  const [testSending, setTestSending] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Track changes
  const handleChange = (field: string, value: string | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setHasChanges(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await axios.put("/api/users/whatsapp-settings", formData);
      // Success
      toast.success("WhatsApp settings updated successfully!");
      setHasChanges(false);
      router.refresh(); // Refresh server component data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          router.push("/login");
          return;
        }
        toast.error(
          `Failed to update: ${error.response?.data?.error || "Unknown error"}`,
        );
      } else {
        toast.error("An error occurred");
      }
      console.error("Error updating settings:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleTestNotification = async () => {
    setTestSending(true);
    try {
      await axios.post("/api/users/test-whatsapp");
      toast.success("📱 Test message sent! Check your WhatsApp.");
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          router.push("/login");
          return;
        }
        toast.error(
          ` ${error.response?.data?.error || "Failed to send test message"}`,
        );
      } else {
        toast.error(" Error sending test message");
      }
      console.error("Error sending test:", error);
    } finally {
      setTestSending(false);
    }
  };

  const isConfigured =
    formData.phone && formData.receiveNotifications && !hasChanges;

  return (
    <div className="space-y-6">
      {/* Settings Form */}
      <form
        onSubmit={handleSubmit}
        className="space-y-6 bg-white border rounded-lg p-6"
      >
        <div>
          <label className="block mb-2 font-medium text-gray-700">
            Phone Number
          </label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="+1234567890"
            className="w-full border border-gray-300 p-3 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Include country code (e.g., +1 for US, +44 for UK, +216 for Tunisia)
          </p>
        </div>

        <div className="border-t pt-4">
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.receiveNotifications}
              onChange={(e) =>
                handleChange("receiveNotifications", e.target.checked)
              }
              className="w-5 h-5 mt-0.5"
            />
            <div>
              <span className="font-medium text-gray-900 block">
                Receive WhatsApp Notifications
              </span>
              <span className="text-sm text-gray-600">
                Get real-time updates about sales, inventory, and low stock
                alerts
              </span>
            </div>
          </label>
        </div>

        {formData.receiveNotifications && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h4 className="font-semibold text-green-900 mb-2">
              You will receive notifications for:
            </h4>
            <ul className="text-sm text-green-800 space-y-1 ml-4 list-disc">
              <li>Sales transactions (outbound inventory)</li>
              <li>Low stock alerts (when inventory drops below 20%)</li>
              <li>Lot depletion warnings</li>
            </ul>
          </div>
        )}

        {/* Unsaved changes warning */}
        {hasChanges && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <p className="text-sm text-yellow-800">
              ⚠️ You have unsaved changes. Click "Save Settings" to apply them.
            </p>
          </div>
        )}

        <div className="flex justify-end">
          <Button
            type="submit"
            disabled={saving || !formData.phone}
            className="cursor-pointer disabled:cursor-not-allowed disabled:bg-gray-400"
          >
            {saving
              ? "Saving..."
              : hasChanges
                ? "Save Changes"
                : "Save Settings"}
          </Button>
        </div>
      </form>

      {/* Test Notification Section */}
      {isConfigured && (
        <div className="bg-white border rounded-lg p-6">
          <h3 className="font-semibold text-gray-900 mb-2">
            Test Your Notifications
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            Send a test WhatsApp message to verify your notifications are
            working correctly.
          </p>
          <Button
            onClick={handleTestNotification}
            disabled={testSending}
            className="cursor-pointer"
          >
            {testSending ? "Sending Test..." : "📤 Send Test Notification"}
          </Button>
        </div>
      )}

      {/* Status Messages */}
      {!isConfigured && !hasChanges && !formData.phone && (
        <div className="bg-black border shadow border-gray-200 rounded-lg p-2 text-center">
          <p className="text-white text-sm">
            👆 Configure your WhatsApp settings above to receive notifications
          </p>
        </div>
      )}

      {hasChanges && (
        <div className="bg-yellow-50 shadow border border-yellow-200 rounded-lg p-2 text-center">
          <p className="text-yellow-800 text-sm">
            💾 Save your settings first, then you can test notifications
          </p>
        </div>
      )}
    </div>
  );
}

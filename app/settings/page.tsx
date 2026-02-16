import { getCurrentUser } from "@/lib/auth/get-current-user";
import { redirect } from "next/navigation";
import LogoutButton from "@/components/buttons/LogoutButton";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import WhatsAppSettingsForm from "./components/WhatsAppSettingsForm";

export default async function WhatsAppSettingsPage() {
  // Get current user on server
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/login");
  }

  // Prepare initial data
  const initialData = {
    phone: currentUser.phone || "",
    receiveNotifications: currentUser.receiveWhatsAppNotifications || false,
  };

  return (
    <main className="min-h-screen bg-muted p-4">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex justify-end gap-2">
          <Link href="/dashboard" className="flex-1">
            <Button variant="outline" className="bg-transparent cursor-pointer">
              📈 Dashboard
            </Button>
          </Link>
          <LogoutButton />
        </div>

        <div className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">
              WhatsApp Notification Settings
            </h1>
            <p className="text-gray-600">
              Configure your WhatsApp notifications for sales and inventory
              updates
            </p>
          </div>

          {/* Opt-In Instructions */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
              📱 WhatsApp Opt-In Required
            </h3>
            <p className="text-sm text-blue-800 mb-3">
              To receive WhatsApp notifications, you must complete these steps:
            </p>
            <ol className="text-sm text-blue-800 space-y-2 ml-4 list-decimal">
              <li>
                Save this number to your WhatsApp contacts:{" "}
                <strong className="bg-blue-100 px-2 py-1 rounded">
                  +1 415 523 8886
                </strong>
              </li>
              <li>
                Send this exact message:{" "}
                <strong className="bg-blue-100 px-2 py-1 rounded font-mono">
                  join zulu-recent
                </strong>
              </li>
              <li>Wait for a confirmation message from Twilio</li>
              <li>Then enable notifications below</li>
            </ol>
            <p className="text-xs text-blue-700 mt-3 italic">
              💡 You only need to do this once per phone number
            </p>
            <p className="text-xs text-blue-700 mt-1 italic">
              💡 This is only for development mode
            </p>
          </div>

          {/* Client Component Form */}
          <WhatsAppSettingsForm initialData={initialData} />
        </div>
      </div>
    </main>
  );
}

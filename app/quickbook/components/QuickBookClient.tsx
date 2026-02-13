"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import LogoutButton from "@/components/buttons/LogoutButton";
import { QuickBooksConnect } from "./QuickBooksConnect";
import { QuickBooksDataModal } from "./QuickBooksDataModal";
import { Button } from "@/components/ui/button";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import Link from "next/link";

type ModalType = "invoices" | "inventory" | "customers" | "reports";

const QuickBookPage = () => {
  const searchParams = useSearchParams();
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalData, setModalData] = useState<any>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalType, setModalType] = useState<ModalType>("invoices");

  useEffect(() => {
    checkConnectionStatus();
  }, []);

  useEffect(() => {
    const qbConnected = searchParams.get("qb_connected");
    const qbError = searchParams.get("qb_error");

    if (qbConnected === "true") {
      setIsConnected(true);
      window.history.replaceState({}, "", "/quickbook");
    } else if (qbError) {
      setError(qbError);
    }
  }, [searchParams]);

  const checkConnectionStatus = async () => {
    try {
      const { data } = await axios.get("/api/quickbooks/status");
      setIsConnected(data.connected);
    } catch (error) {
      console.error("Error checking QB status:", error);
    } finally {
      setLoading(false);
    }
  };

  const openModal = async (
    title: string,
    endpoint: string,
    type: ModalType,
  ) => {
    setModalTitle(title);
    setModalType(type);
    setModalOpen(true);
    setModalLoading(true);
    setModalData(null);

    try {
      const { data } = await axios.get(endpoint);
      setModalData(data);
    } catch (error) {
      console.error(`Error fetching ${title}:`, error);
      setModalData({ error: "Failed to fetch data" });
    } finally {
      setModalLoading(false);
    }
  };

  const handleViewInvoices = () => {
    openModal("QuickBooks Invoices", "/api/quickbooks/invoices", "invoices");
  };

  const handleSyncInventory = () => {
    openModal("Inventory Items", "/api/quickbooks/inventory", "inventory");
  };

  const handleManageCustomers = () => {
    openModal("QuickBooks Customers", "/api/quickbooks/customers", "customers");
  };

  const handleViewReports = () => {
    openModal(
      "Profit & Loss Report (Last 30 Days)",
      "/api/quickbooks/reports",
      "reports",
    );
  };

  const disconnectQuickBooks = async () => {
    try {
      await axios.post("/api/quickbooks/disconnect");
      setIsConnected(false);
      toast.success("Disconnected from QuickBooks");
    } catch (error) {
      console.error("Error disconnecting:", error);
      toast.error("Failed to disconnect");
    } finally {
      setConfirmOpen(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-muted p-4">
        <div className="max-w-3xl mx-auto flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-muted p-4">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="flex justify-end gap-2">
          <Link href="/dashboard" className="flex-1">
            <Button
              variant="outline"
              className="bg-transparent cursor-pointer"
            >
              📈 Dashboard
            </Button>
          </Link>
          <LogoutButton />
        </div>

        <h1 className="text-2xl font-bold text-foreground">
          QuickBooks Integration
        </h1>

        {isConnected && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center gap-3">
            <CheckCircle2 className="text-green-600 h-6 w-6" />
            <div>
              <p className="text-green-800 font-semibold">
                Successfully connected to QuickBooks!
              </p>
              <p className="text-green-700 text-sm">
                Your account is now synced with QuickBooks.
              </p>
            </div>
          </div>
        )}

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3">
            <XCircle className="text-red-600 h-6 w-6" />
            <div>
              <p className="text-red-800 font-semibold">Connection failed</p>
              <p className="text-red-700 text-sm">Error: {error}</p>
            </div>
          </div>
        )}

        {isConnected ? (
          <div className="space-y-6">
            <div className="p-6 border rounded-lg bg-white">
              <h2 className="text-xl font-semibold mb-4">QuickBooks Status</h2>
              <div className="flex items-center gap-2 mb-6">
                <div className="h-3 w-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-700 font-medium">Connected</span>
              </div>

              <div className="space-y-4">
                <h3 className="font-semibold">Available Actions:</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    className="justify-start cursor-pointer"
                    onClick={handleViewInvoices}
                  >
                    📊 View Invoices
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start cursor-pointer"
                    onClick={handleSyncInventory}
                  >
                    📦 Sync Inventory
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start cursor-pointer"
                    onClick={handleManageCustomers}
                  >
                    👥 Manage Customers
                  </Button>
                  {/* <Button
                    variant="outline"
                    className="justify-start"
                    onClick={handleViewReports}
                  >
                    📈 View Reports
                  </Button> */}
                </div>
              </div>

              <div className="mt-6 pt-6 border-t flex justify-end">
                <Button
                  className="cursor-pointer"
                  variant="destructive"
                  onClick={() => setConfirmOpen(true)}
                >
                  Disconnect QuickBooks
                </Button>
              </div>
              {confirmOpen && (
                <Dialog open={confirmOpen} onOpenChange={setConfirmOpen}>
                  <DialogContent className="w-md!">
                    <DialogHeader>
                      <DialogTitle>Disconnect QuickBooks</DialogTitle>
                    </DialogHeader>

                    <p className="text-sm text-muted-foreground">
                      Are you sure you want to disconnect QuickBooks?
                    </p>

                    <DialogFooter className="mt-4">
                      <Button
                        variant="outline"
                        onClick={() => setConfirmOpen(false)}
                        className="cursor-pointer"
                      >
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={disconnectQuickBooks}
                        className="cursor-pointer"
                      >
                        Disconnect
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              )}
            </div>
          </div>
        ) : (
          <QuickBooksConnect />
        )}
      </div>

      {/* Data Modal */}
      <QuickBooksDataModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        data={modalData}
        loading={modalLoading}
        type={modalType}
      />
    </main>
  );
};

export default QuickBookPage;

// components/QuickBooksDataModal.tsx
"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2 } from "lucide-react";
import { InvoicesTable } from "./InvoicesTable";
import { InventoryTable } from "./InventoryTable";
import { CustomersTable } from "./CustomersTable";
import { ReportsView } from "./ReportsView";

interface QuickBooksDataModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  data: any;
  loading: boolean;
  type: "invoices" | "inventory" | "customers" | "reports";
}

export function QuickBooksDataModal({
  isOpen,
  onClose,
  title,
  data,
  loading,
  type,
}: QuickBooksDataModalProps) {
  const renderContent = () => {
    if (loading) {
      return (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      );
    }

    if (data?.error) {
      return (
        <div className="text-center py-8 text-red-600">Error: {data.error}</div>
      );
    }

    if (!data) {
      return (
        <div className="text-center py-8 text-muted-foreground">
          No data available
        </div>
      );
    }

    switch (type) {
      case "invoices":
        return <InvoicesTable invoices={data.QueryResponse?.Invoice || []} />;

      case "inventory":
        return <InventoryTable items={data.QueryResponse?.Item || []} />;

      case "customers":
        return (
          <CustomersTable customers={data.QueryResponse?.Customer || []} />
        );

      case "reports":
        return <ReportsView report={data} />;

      default:
        return (
          <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-full max-h-[85vh]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-full max-h-[70vh] pr-4">
          {renderContent()}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// components/QuickBooksConnect.tsx
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function QuickBooksConnect() {
  const [connecting, setConnecting] = useState(false);

  const handleConnect = () => {
    setConnecting(true);
    window.open("/api/quickbooks/connect", "_blank");
  };
  return (
    <div className="p-6 border rounded-lg flex flex-col justify-center items-center bg-white">
      <p className="mb-4 text-gray-600 text-center">
        Connect your QuickBooks account to automatically create invoices and
        sync inventory.
      </p>
      <img
        src="https://liveimages.algoworks.com/new-algoworks/wp-content/uploads/2022/02/09153314/IntegAnimate-01.gif"
        alt="QuickBooks integration animation"
        className="w-64 h-64"
      />
      <Button
        onClick={handleConnect}
        disabled={connecting}
        className="cursor-pointer"
        size="lg"
      >
        {connecting ? "Connecting..." : "Connect to QuickBooks"}
      </Button>
      {connecting && (
        <p className="mt-2 text-sm text-gray-500">
          Please complete the authorization...
        </p>
      )}
    </div>
  );
}

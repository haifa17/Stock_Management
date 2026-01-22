"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export function BarcodeScanner() {
  const [scannedCode, setScannedCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");

  const scannerRef = useRef<any>(null);

  useEffect(() => {
    if (!isScanning) return;

    let isMounted = true;

    const startScanner = async () => {
      try {
        // ✅ dynamic import (VERY IMPORTANT for Vercel)
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!isMounted) return;

        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText: string) => {
            setScannedCode(decodedText);
            scanner.stop();
            setIsScanning(false);
          },
          () => {
            // required by TypeScript
            // called continuously when no code is detected
          }
        );
      } catch (err) {
        console.error(err);
        setError("Impossible d'accéder à la caméra");
        setIsScanning(false);
      }
    };

    // ⏱ allow DOM to mount before scanner starts
    const timeout = setTimeout(startScanner, 150);

    return () => {
      isMounted = false;
      clearTimeout(timeout);

      if (scannerRef.current) {
        scannerRef.current.stop().catch(() => {});
      }
    };
  }, [isScanning]);

  return (
    <div className="space-y-3">
      {!isScanning ? (
        <Button
          onClick={() => setIsScanning(true)}
          className="w-full cursor-pointer"
          variant="secondary"
        >
          Scan QR / Barcode
        </Button>
      ) : (
        <>
          <div
            id="qr-reader"
            className="w-full min-h-[300px] rounded-lg overflow-hidden bg-black"
          />

          <Button
            onClick={() => setIsScanning(false)}
            className="w-full"
            variant="destructive"
          >
            Arrêter le scan
          </Button>
        </>
      )}

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      {scannedCode && (
        <p className="text-sm text-muted-foreground text-center">
          Scanned:{" "}
          <span className="font-mono text-foreground">
            {scannedCode}
          </span>
        </p>
      )}
    </div>
  );
}

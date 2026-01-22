"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export function BarcodeScanner() {
  const [scannedCode, setScannedCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");

  const scannerRef = useRef<any>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!isScanning) return;

    const startScanner = async () => {
      try {
        // Wait for DOM to be ready
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Check if element exists
        const element = document.getElementById("qr-reader");
        if (!element) {
          throw new Error("Scanner element not found");
        }

        if (!isMountedRef.current) return;

        // Dynamic import
        const { Html5Qrcode } = await import("html5-qrcode");

        if (!isMountedRef.current) return;

        // Check if scanner already exists
        if (scannerRef.current) {
          try {
            await scannerRef.current.stop();
          } catch (e) {
            // Ignore stop errors
          }
        }

        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText: string) => {
            if (isMountedRef.current) {
              setScannedCode(decodedText);
              setIsScanning(false);
              scanner.stop().catch(() => {});
            }
          },
          () => {
            // Error callback - required by library
          }
        );
      } catch (err: any) {
        console.error("Scanner error:", err);
        if (isMountedRef.current) {
          setError(
            err?.message?.includes("Permission") 
              ? "Accès à la caméra refusé" 
              : "Impossible d'accéder à la caméra"
          );
          setIsScanning(false);
        }
      }
    };

    startScanner();

    return () => {
      if (scannerRef.current) {
        scannerRef.current
          .stop()
          .catch(() => {})
          .finally(() => {
            scannerRef.current = null;
          });
      }
    };
  }, [isScanning]);

  const handleStopScanning = () => {
    setIsScanning(false);
    setError("");
  };

  return (
    <div className="space-y-3">
      {!isScanning ? (
        <Button
          onClick={() => {
            setError("");
            setIsScanning(true);
          }}
          className="w-full"
          variant="secondary"
        >
          📷 Scanner QR / Code-barres
        </Button>
      ) : (
        <>
          <div
            id="qr-reader"
            className="w-full min-h-[300px] rounded-lg overflow-hidden bg-black"
          />

          <Button
            onClick={handleStopScanning}
            className="w-full"
            variant="destructive"
          >
            ❌ Arrêter le scan
          </Button>
        </>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600 text-center">{error}</p>
        </div>
      )}

      {scannedCode && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm text-green-800 text-center">
            ✅ Code scanné:{" "}
            <span className="font-mono font-semibold">
              {scannedCode}
            </span>
          </p>
        </div>
      )}
    </div>
  );
}
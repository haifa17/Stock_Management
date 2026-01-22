"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export function BarcodeScanner() {
  const [scannedCode, setScannedCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const scannerRef = useRef<any>(null);
  const isMountedRef = useRef(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      stopScanner();
    };
  }, []);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = await scannerRef.current.getState();
        if (state === 2) { // SCANNING state
          await scannerRef.current.stop();
        }
      } catch (e) {
        console.log("Scanner already stopped");
      }
      scannerRef.current = null;
    }
  };

  useEffect(() => {
    if (!isScanning) {
      stopScanner();
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const startScanner = async () => {
      setIsLoading(true);
      setError("");

      try {
        // Wait for DOM
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const element = document.getElementById("qr-reader");
        if (!element) {
          throw new Error("Scanner element not found in DOM");
        }

        if (!isMountedRef.current) return;

        // Dynamic import with error handling
        let Html5Qrcode;
        try {
          const module = await import("html5-qrcode");
          Html5Qrcode = module.Html5Qrcode;
        } catch (importError) {
          console.error("Failed to import html5-qrcode:", importError);
          throw new Error("Failed to load scanner library");
        }

        if (!isMountedRef.current) return;

        // Stop any existing scanner
        await stopScanner();

        if (!isMountedRef.current) return;

        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        // Get camera devices
        const devices = await Html5Qrcode.getCameras();
        if (!devices || devices.length === 0) {
          throw new Error("No camera found on device");
        }

        if (!isMountedRef.current) return;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1.0,
          },
          (decodedText: string) => {
            if (isMountedRef.current) {
              setScannedCode(decodedText);
              setIsScanning(false);
            }
          },
          (errorMessage: string) => {
            // Scanning error - ignore, happens continuously
          }
        );

        if (isMountedRef.current) {
          setIsLoading(false);
        }
      } catch (err: any) {
        console.error("Scanner initialization error:", err);
        if (isMountedRef.current) {
          let errorMsg = "Impossible d'accéder à la caméra";
          
          if (err?.name === "NotAllowedError" || err?.message?.includes("Permission")) {
            errorMsg = "Accès à la caméra refusé. Veuillez autoriser l'accès.";
          } else if (err?.name === "NotFoundError") {
            errorMsg = "Aucune caméra trouvée sur cet appareil";
          } else if (err?.message) {
            errorMsg = err.message;
          }

          setError(errorMsg);
          setIsScanning(false);
          setIsLoading(false);
        }
      }
    };

    timeoutId = setTimeout(startScanner, 100);

    return () => {
      clearTimeout(timeoutId);
      stopScanner();
    };
  }, [isScanning]);

  const handleStopScanning = () => {
    setIsScanning(false);
    setError("");
    setIsLoading(false);
  };

  const handleStartScanning = () => {
    setError("");
    setScannedCode("");
    setIsScanning(true);
  };

  return (
    <div className="space-y-3">
      {!isScanning ? (
        <Button
          onClick={handleStartScanning}
          className="w-full"
          variant="secondary"
          disabled={isLoading}
        >
          📷 Scanner QR / Code-barres
        </Button>
      ) : (
        <>
          {isLoading && (
            <div className="text-center p-4">
              <p className="text-sm text-muted-foreground">
                Chargement de la caméra...
              </p>
            </div>
          )}

          <div
            id="qr-reader"
            className="w-full min-h-[300px] rounded-lg overflow-hidden bg-black"
            style={{ display: isLoading ? 'none' : 'block' }}
          />

          <Button
            onClick={handleStopScanning}
            className="w-full"
            variant="destructive"
            disabled={isLoading}
          >
            ❌ Arrêter le scan
          </Button>
        </>
      )}

      {error && (
        <div className="p-3 rounded-lg bg-red-50 border border-red-200">
          <p className="text-sm text-red-600 text-center font-medium">
            {error}
          </p>
        </div>
      )}

      {scannedCode && (
        <div className="p-3 rounded-lg bg-green-50 border border-green-200">
          <p className="text-sm text-green-800 text-center">
            ✅ Code scanné
          </p>
          <p className="font-mono font-semibold text-center mt-1 text-green-900">
            {scannedCode}
          </p>
        </div>
      )}
    </div>
  );
}
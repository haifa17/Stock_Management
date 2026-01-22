"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Html5Qrcode } from "html5-qrcode";

export function BarcodeScanner() {
  const [scannedCode, setScannedCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const scannerRef = useRef<Html5Qrcode | null>(null);

  useEffect(() => {
    if (!isScanning) return;

    const startScanner = async () => {
      try {
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            setScannedCode(decodedText);
            scanner.stop();
            setIsScanning(false);
          },
          (errorMessage) => {
            // obligatoire pour TS — mais normal pendant le scan
            // console.log(errorMessage)
          },
        );
      } catch (err) {
        console.error(err);
        setError("Impossible d'accéder à la caméra");
        setIsScanning(false);
      }
    };

    // ⏱ attendre que le DOM soit prêt
    const timeout = setTimeout(startScanner, 100);

    return () => {
      clearTimeout(timeout);
      scannerRef.current?.stop();
    };
  }, [isScanning]);

  return (
    <div className="space-y-3">
      {!isScanning ? (
        <Button
          onClick={() => setIsScanning(true)}
          className="w-full"
          variant="secondary"
        >
          Scan QR / Barcode
        </Button>
      ) : (
        <>
          <div
            id="qr-reader"
            className="w-full rounded-lg overflow-hidden min-h-[300px]"
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

      {error && <p className="text-sm text-red-600 text-center">{error}</p>}

      {scannedCode && (
        <p className="text-sm text-muted-foreground text-center">
          Scanned:{" "}
          <span className="font-mono text-foreground">{scannedCode}</span>
        </p>
      )}
    </div>
  );
}

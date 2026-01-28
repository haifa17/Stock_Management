"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
interface BarcodeScannerProps {
  onScan?: (code: string) => void;
}

export function BarcodeScanner({ onScan }: BarcodeScannerProps) {
  const [scannedCode, setScannedCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const [isMounted, setIsMounted] = useState(false);
  const scannerRef = useRef<any>(null);
  const isRunningRef = useRef(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isScanning || !isMounted) return;

    let isCancelled = false;

    const startScanner = async () => {
      try {
        const { Html5Qrcode } = await import("html5-qrcode");

        if (isCancelled) return;

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
            onScan?.(decodedText);
            isRunningRef.current = false;
            scanner.stop().catch(() => {});
            setIsScanning(false);
          },
          () => {
            // Normal scanning errors - ignore
          },
        );

        isRunningRef.current = true;
      } catch (err) {
        console.error(err);
        setError("Impossible d'accéder à la caméra");
        setIsScanning(false);
        isRunningRef.current = false;
      }
    };

    const timeout = setTimeout(startScanner, 100);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);

      if (scannerRef.current && isRunningRef.current) {
        scannerRef.current.stop().catch(() => {});
        isRunningRef.current = false;
      }
    };
  }, [isScanning, isMounted]);

  const handleStopScanning = () => {
    if (scannerRef.current && isRunningRef.current) {
      scannerRef.current.stop().catch(() => {});
      isRunningRef.current = false;
    }
    setIsScanning(false);
  };

  if (!isMounted) {
    return null;
  }

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
          Scan QR / Barcode
        </Button>
      ) : (
        <>
          <div
            id="qr-reader"
            className="w-full rounded-lg overflow-hidden min-h-[300px] bg-black"
          />
          <Button
            onClick={handleStopScanning}
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

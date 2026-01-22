"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export function BarcodeScanner() {
  const [scannedCode, setScannedCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const scannerRef = useRef<any>(null);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        await scannerRef.current.clear();
      } catch (e) {
        // Ignore errors
      }
      scannerRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (!isScanning) {
      stopScanner();
      return;
    }

    let mounted = true;
    setIsLoading(true);
    setError("");

    const initScanner = async () => {
      try {
        await new Promise(resolve => setTimeout(resolve, 300));
        
        const element = document.getElementById("qr-reader");
        if (!element || !mounted) {
          throw new Error("Element not ready");
        }

        // Clean up any existing scanner
        await stopScanner();

        if (!mounted) return;

        const { Html5Qrcode } = await import("html5-qrcode");
        
        if (!mounted) return;

        // Check for cameras
        try {
          const devices = await Html5Qrcode.getCameras();
          if (!devices || devices.length === 0) {
            throw new Error("Aucune caméra trouvée");
          }
        } catch (err) {
          throw new Error("Impossible d'accéder aux caméras");
        }

        if (!mounted) return;

        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        const config = {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
          showTorchButtonIfSupported: true,
          videoConstraints: {
            facingMode: "environment"
          }
        };

        await scanner.start(
          { facingMode: "environment" },
          config,
          (decodedText: string) => {
            console.log("Code detected:", decodedText);
            if (mounted) {
              setScannedCode(decodedText);
              setIsScanning(false);
            }
          },
          (errorMessage: string) => {
            // Continuous scanning errors - ignore
          }
        );

        if (mounted) {
          setIsLoading(false);
          console.log("Scanner started successfully");
        }

      } catch (err: any) {
        console.error("Scanner error:", err);
        
        if (mounted) {
          let errorMsg = "Erreur lors de l'initialisation";
          
          if (err?.name === "NotAllowedError" || err?.message?.includes("Permission")) {
            errorMsg = "⚠️ Veuillez autoriser l'accès à la caméra dans les paramètres de votre navigateur";
          } else if (err?.name === "NotFoundError" || err?.message?.includes("caméra")) {
            errorMsg = "Aucune caméra détectée sur cet appareil";
          } else if (err?.name === "NotReadableError") {
            errorMsg = "La caméra est utilisée par une autre application";
          } else if (err?.message) {
            errorMsg = err.message;
          }

          setError(errorMsg);
          setIsScanning(false);
          setIsLoading(false);
        }
      }
    };

    initScanner();

    return () => {
      mounted = false;
      stopScanner();
    };
  }, [isScanning]);

  const handleStartScanning = () => {
    setError("");
    setScannedCode("");
    setIsScanning(true);
  };

  const handleStopScanning = () => {
    setIsScanning(false);
    setError("");
    setIsLoading(false);
  };

  return (
    <div className="space-y-4">
      {!isScanning ? (
        <Button
          onClick={handleStartScanning}
          className="w-full"
          variant="secondary"
          size="lg"
        >
          📷 Scanner QR / Code-barres
        </Button>
      ) : (
        <div className="space-y-3">
          {isLoading && (
            <div className="text-center p-6 bg-gray-100 rounded-lg">
              <div className="animate-pulse">
                <div className="text-2xl mb-2">📷</div>
                <p className="text-sm text-gray-600 font-medium">
                  Initialisation de la caméra...
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Autorisez l'accès si demandé
                </p>
              </div>
            </div>
          )}

          <div
            id="qr-reader"
            className="w-full rounded-lg overflow-hidden bg-black"
            style={{ 
              minHeight: '300px',
              display: isLoading ? 'none' : 'block'
            }}
          />

          <Button
            onClick={handleStopScanning}
            className="w-full"
            variant="destructive"
            size="lg"
          >
            ❌ Arrêter le scan
          </Button>
        </div>
      )}

      {error && (
        <div className="p-4 rounded-lg bg-red-50 border-2 border-red-200">
          <p className="text-sm text-red-700 font-medium text-center">
            {error}
          </p>
          <p className="text-xs text-red-600 text-center mt-2">
            Vérifiez que votre navigateur a l'autorisation d'accéder à la caméra
          </p>
        </div>
      )}

      {scannedCode && (
        <div className="p-4 rounded-lg bg-green-50 border-2 border-green-200">
          <div className="text-center">
            <p className="text-lg mb-2">✅</p>
            <p className="text-sm text-green-700 font-medium mb-2">
              Code scanné avec succès
            </p>
            <p className="font-mono font-bold text-green-900 text-lg break-all">
              {scannedCode}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";

export function BarcodeScanner() {
  const [scannedCode, setScannedCode] = useState("");
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState("");
  const [cameraReady, setCameraReady] = useState(false);

  const scannerRef = useRef<any>(null);
  const initializingRef = useRef(false);

  const stopScanner = async () => {
    if (scannerRef.current) {
      try {
        await scannerRef.current.stop();
        scannerRef.current.clear();
      } catch (e) {
        console.log("Stop error (ignored):", e);
      }
      scannerRef.current = null;
    }
    setCameraReady(false);
  };

  useEffect(() => {
    return () => {
      stopScanner();
    };
  }, []);

  useEffect(() => {
    if (!isScanning || initializingRef.current) {
      if (!isScanning) {
        stopScanner();
      }
      return;
    }

    let mounted = true;
    initializingRef.current = true;
    setError("");
    setCameraReady(false);

    const initScanner = async () => {
      try {
        // Wait for DOM to fully render
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const element = document.getElementById("qr-reader");
        if (!element || !mounted) {
          throw new Error("Scanner element not found");
        }

        // Cleanup any existing instance
        await stopScanner();

        if (!mounted) return;

        // Import library
        const { Html5Qrcode } = await import("html5-qrcode");
        
        if (!mounted) return;

        console.log("Checking for cameras...");
        const devices = await Html5Qrcode.getCameras();
        console.log("Available cameras:", devices);
        
        if (!devices || devices.length === 0) {
          throw new Error("Aucune caméra disponible");
        }

        if (!mounted) return;

        const scanner = new Html5Qrcode("qr-reader", {
          verbose: false,
          formatsToSupport: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13]
        });
        scannerRef.current = scanner;

        console.log("Starting camera...");

        // iOS Safari-friendly configuration
        const qrCodeSuccessCallback = (decodedText: string) => {
          console.log("✅ Code scanned:", decodedText);
          if (mounted) {
            setScannedCode(decodedText);
            setIsScanning(false);
          }
        };

        const config = {
          fps: 10,
          qrbox: function(viewfinderWidth: number, viewfinderHeight: number) {
            const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
            const qrboxSize = Math.floor(minEdge * 0.7);
            return {
              width: qrboxSize,
              height: qrboxSize
            };
          },
          aspectRatio: 1.0,
        };

        // Try environment camera first (back camera)
        try {
          await scanner.start(
            { facingMode: "environment" },
            config,
            qrCodeSuccessCallback,
            undefined
          );
        } catch (envError) {
          console.log("Environment camera failed, trying any camera...");
          // Fallback to any available camera
          await scanner.start(
            { facingMode: { ideal: "environment" } },
            config,
            qrCodeSuccessCallback,
            undefined
          );
        }

        if (mounted) {
          setCameraReady(true);
          console.log("✅ Camera started successfully");
        }

      } catch (err: any) {
        console.error("❌ Scanner initialization error:", err);
        
        if (mounted) {
          let errorMsg = "Impossible de démarrer la caméra";
          
          if (err?.name === "NotAllowedError" || err?.message?.includes("permission")) {
            errorMsg = "Accès à la caméra refusé. Vérifiez les permissions dans Réglages → Safari → Caméra";
          } else if (err?.name === "NotFoundError") {
            errorMsg = "Aucune caméra trouvée sur cet appareil";
          } else if (err?.name === "NotReadableError") {
            errorMsg = "Caméra occupée par une autre application";
          } else if (err?.message?.includes("insecure")) {
            errorMsg = "HTTPS requis pour accéder à la caméra";
          } else if (err?.message) {
            errorMsg = err.message;
          }

          setError(errorMsg);
          setIsScanning(false);
          setCameraReady(false);
        }
      } finally {
        initializingRef.current = false;
      }
    };

    initScanner();

    return () => {
      mounted = false;
    };
  }, [isScanning]);

  const handleStartScanning = () => {
    console.log("🎥 Starting scan...");
    setError("");
    setScannedCode("");
    setIsScanning(true);
  };

  const handleStopScanning = () => {
    console.log("⏹️ Stopping scan...");
    setIsScanning(false);
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
          {!cameraReady && !error && (
            <div className="text-center p-8 bg-blue-50 rounded-lg border-2 border-blue-200">
              <div className="animate-pulse">
                <div className="text-4xl mb-3">📷</div>
                <p className="text-base text-blue-700 font-semibold mb-2">
                  Démarrage de la caméra...
                </p>
                <p className="text-sm text-blue-600">
                  Autorisez l'accès si demandé
                </p>
              </div>
            </div>
          )}

          <div
            id="qr-reader"
            className="w-full rounded-lg overflow-hidden"
            style={{ 
              minHeight: '350px',
              maxHeight: '450px',
              backgroundColor: '#000',
              display: !cameraReady && !error ? 'none' : 'block'
            }}
          />

          {cameraReady && (
            <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
              <p className="text-sm text-green-700 font-medium">
                ✓ Caméra active - Pointez vers un code
              </p>
            </div>
          )}

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
        <div className="p-4 rounded-lg bg-red-50 border-2 border-red-300">
          <p className="text-sm text-red-800 font-semibold text-center mb-2">
            ⚠️ Erreur
          </p>
          <p className="text-sm text-red-700 text-center">
            {error}
          </p>
        </div>
      )}

      {scannedCode && (
        <div className="p-5 rounded-lg bg-green-50 border-2 border-green-300">
          <div className="text-center">
            <p className="text-3xl mb-3">✅</p>
            <p className="text-sm text-green-700 font-semibold mb-3">
              Code scanné avec succès !
            </p>
            <div className="bg-white p-3 rounded border border-green-200">
              <p className="font-mono font-bold text-green-900 text-base break-all">
                {scannedCode}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
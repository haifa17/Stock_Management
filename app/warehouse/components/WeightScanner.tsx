"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Tesseract from "tesseract.js";
import { Barcode, Scale, Trash2, CheckCircle, XCircle } from "lucide-react";

interface WeightScannerProps {
  onWeightDetected?: (weight: number, unit: string, fullText: string) => void;
  onBarcodeScanned?: (code: string) => void;
}
interface ScannedWeight {
  id: string;
  weight: number;
  unit: string;
  timestamp: number;
}
export function WeightScanner({
  onWeightDetected,
  onBarcodeScanned,
}: WeightScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<"barcode" | "weight">("barcode");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const log = (message: string) => {
    console.log(message);
    setDebugLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${message}`,
      ...prev.slice(0, 49), // keep last 50 logs
    ]);
  };

  const [scannedWeights, setScannedWeights] = useState<ScannedWeight[]>([]);
  const [totalWeight, setTotalWeight] = useState(0);

  const scannerRef = useRef<any>(null);
  const isRunningRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (scannedWeights.length > 0) {
      const total = scannedWeights.reduce((sum, item) => {
        let weightInLbs = item.weight;
        if (item.unit === "KG") {
          weightInLbs = item.weight * 2.20462;
        }
        return sum + weightInLbs;
      }, 0);

      setTotalWeight(total);
      onWeightDetected?.(
        total,
        "LBS",
        `Total of ${scannedWeights.length} weights`,
      );
    } else {
      setTotalWeight(0);
    }
  }, [scannedWeights, onWeightDetected]);

  // Barcode scanning effect
  useEffect(() => {
    if (!isScanning || !isMounted || scanMode !== "barcode") return;

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
            fps: 30,
            qrbox: { width: 400, height: 200 },
            aspectRatio: 2.0,
            disableFlip: false,
          },
          (decodedText, decodedResult) => {
            console.log("Scanned code:", decodedText);
            onBarcodeScanned?.(decodedText);
            isRunningRef.current = false;
            scanner.stop().catch(() => {});
            setIsScanning(false);
          },
          () => {},
        );

        isRunningRef.current = true;
      } catch (err) {
        console.error(err);
        setError("Unable to access camera");
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
  }, [isScanning, isMounted, scanMode, onBarcodeScanned]);

  // Weight scanning effect
  useEffect(() => {
    if (!isScanning || !isMounted || scanMode !== "weight") return;

    let isCancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
        });

        if (isCancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          await videoRef.current.play();
        }
      } catch (err) {
        console.error("Camera error:", err);
        setError("Unable to access the camera. Please check permissions.");
        setIsScanning(false);
      }
    };

    const timeout = setTimeout(startCamera, 100);

    return () => {
      isCancelled = true;
      clearTimeout(timeout);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    };
  }, [isScanning, isMounted, scanMode]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setError("");
    // Auto-clear after 3 seconds
    setTimeout(() => setSuccessMessage(""), 3000);
  };

  const showError = (message: string) => {
    setError(message);
    setSuccessMessage("");
  };

  const captureAndProcessImage = async () => {
    if (!videoRef.current || !canvasRef.current) {
      showError("Camera not ready");
      return;
    }

    setIsProcessing(true);
    setError("");
    setSuccessMessage("");

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) {
      setIsProcessing(false);
      return;
    }

    try {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
      const processedImageData = preprocessImageForOCR(imageData);
      context.putImageData(processedImageData, 0, 0);

      const finalImage = canvas.toDataURL("image/png");

      if (typeof Tesseract === "undefined") {
        throw new Error("Tesseract library failed to load");
      }

      const result = await Tesseract.recognize(finalImage, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
        workerPath:
          "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/worker.min.js",
        corePath: "https://cdn.jsdelivr.net/npm/tesseract.js-core@5",
      });

      const text = result.data.text;
      log(`OCR raw text: "${text.replace(/\n/g, " ").trim()}"`);

      const weightInfo = extractWeight(text);

      if (weightInfo) {
        log(`✓ Weight matched: ${weightInfo.weight} ${weightInfo.unit}`);
        const newWeight: ScannedWeight = {
          id: Date.now().toString(),
          weight: weightInfo.weight,
          unit: weightInfo.unit,
          timestamp: Date.now(),
        };
        setScannedWeights((prev) => [...prev, newWeight]);
        showSuccess(`✓ Weight added: ${weightInfo.weight} ${weightInfo.unit}`);
      } else {
        log(`✗ No weight pattern matched in: "${text.replace(/\n/g, " ").trim()}"`);
        showError(
          `Weight not detected. OCR read: "${text.substring(0, 80).trim()}". Try better lighting and positioning.`,
        );
      }
    } catch (err: any) {
      log(`OCR Error: ${err.message}`);
      showError(
        `OCR failed: ${err.message}. Please try manual entry or better lighting.`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const preprocessImageForOCR = (imageData: ImageData): ImageData => {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      let adjusted = gray < 128 ? gray * 0.5 : 128 + (gray - 128) * 1.5;
      adjusted = Math.min(255, Math.max(0, adjusted));
      data[i] = adjusted;
      data[i + 1] = adjusted;
      data[i + 2] = adjusted;
    }
    return imageData;
  };

  const extractWeight = (
    text: string,
  ): { weight: number; unit: string } | null => {
    const cleanText = text
      .replace(/\s+/g, " ")
      .replace(/[|\/\\]/g, "")
      .trim()
      .toUpperCase();

    log(`Cleaned OCR text: "${cleanText}"`);

    const patterns = [
      /NET\s*:?\s*(\d+\.?\d*)\s*(LB|LBS|POUND|POUNDS)/i,
      /\bWT\s*:?\s*(\d+\.?\d*)\s*(KG|KGS|KGSS|KILOGRAM)/i,
      /WEIGHT\s*:?\s*(\d+\.?\d*)\s*(LB|LBS|KG|KGS|POUND|KILOGRAM)/i,
      /(\d+\.?\d+)\s*(LB|LBS|KG|KGS|KGSS|POUND|KILOGRAM)/i,
      /(?:NET|WT|WEIGHT).*?(\d+\.?\d+).*?(LB|KG)/i,
    ];

    for (let i = 0; i < patterns.length; i++) {
      const match = cleanText.match(patterns[i]);
      if (match) {
        const weight = parseFloat(match[1]);
        let unit = match[2].toUpperCase();
        if (unit.includes("LB") || unit.includes("POUND")) unit = "LBS";
        if (unit.includes("KG") || unit.includes("KILOGRAM")) unit = "KG";
        if (weight > 0 && weight < 10000) {
          log(`✓ Pattern ${i + 1} matched: ${weight} ${unit}`);
          return { weight, unit };
        }
      }
    }
    log("✗ No weight pattern matched");
    return null;
  };

  const removeWeight = (id: string) => {
    setScannedWeights((prev) => prev.filter((w) => w.id !== id));
  };

  const clearAllWeights = () => {
    setScannedWeights([]);
    setError("");
    setSuccessMessage("");
  };

  const finishScanning = () => stopScanning();

  const stopScanning = () => {
    if (scanMode === "barcode" && scannerRef.current && isRunningRef.current) {
      scannerRef.current.stop().catch(() => {});
      isRunningRef.current = false;
    }
    if (scanMode === "weight") {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
    }
    setIsScanning(false);
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-3">
      {/* Mode Selection Buttons */}
      {!isScanning && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => {
              setScanMode("barcode");
              setError("");
              setSuccessMessage("");
              setIsScanning(true);
            }}
            variant="secondary"
            className="w-full"
          >
            <Barcode className="mr-2 h-4 w-4" /> Barcode
          </Button>
          <Button
            onClick={() => {
              setScanMode("weight");
              setError("");
              setSuccessMessage("");
              setScannedWeights([]);
              setIsScanning(true);
            }}
            variant="secondary"
            className="w-full"
          >
            <Scale className="mr-2 h-4 w-4" /> Weight (OCR)
          </Button>
        </div>
      )}

      {/* Success Message Banner */}
      {successMessage && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-400 rounded-lg p-3 animate-in fade-in duration-200">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-sm font-semibold text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Error Message Banner */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-300 rounded-lg p-3 animate-in fade-in duration-200">
          <XCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Scanned weights summary (visible when not scanning) */}
      {scannedWeights.length > 0 && !isScanning && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-green-900">
              ⚖️ Scanned Weights ({scannedWeights.length})
            </h3>
            <Button
              onClick={clearAllWeights}
              size="sm"
              variant="ghost"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear All
            </Button>
          </div>

          <div className="space-y-2 mb-3">
            {scannedWeights.map((item, index) => (
              <div
                key={item.id}
                className="flex items-center justify-between bg-white rounded p-2 text-sm"
              >
                <span className="text-gray-700">
                  #{index + 1}:{" "}
                  <strong>
                    {item.weight} {item.unit}
                  </strong>
                  {item.unit === "KG" && (
                    <span className="text-gray-500 ml-2">
                      ({(item.weight * 2.20462).toFixed(2)} LBS)
                    </span>
                  )}
                </span>
                <Button
                  onClick={() => removeWeight(item.id)}
                  size="sm"
                  variant="ghost"
                  className="h-6 w-6 p-0 text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>

          <div className="bg-green-100 rounded-lg p-3 border border-green-300">
            <div className="text-center">
              <p className="text-xs text-green-700 mb-1">Total Weight</p>
              <p className="text-2xl font-bold text-green-900">
                {totalWeight.toFixed(2)} LBS
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Barcode Scanner View */}
      {isScanning && scanMode === "barcode" && (
        <>
          <div
            id="qr-reader"
            className="w-full rounded-lg overflow-hidden min-h-[300px] bg-black"
          />
          <Button onClick={stopScanning} className="w-full" variant="destructive">
            Stop Scanning
          </Button>
        </>
      )}

      {/* Weight Scanner View */}
      {isScanning && scanMode === "weight" && (
        <div className="space-y-3">
          {scannedWeights.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900 text-center font-medium">
                ✓ {scannedWeights.length} weight
                {scannedWeights.length !== 1 ? "s" : ""} scanned • Total:{" "}
                <strong>{totalWeight.toFixed(2)} LBS</strong>
              </p>
              <p className="text-xs text-blue-700 text-center mt-1">
                Continue scanning more labels or click "Done" to finish
              </p>
            </div>
          )}

          <div className="relative w-full rounded-lg overflow-hidden bg-black min-h-[300px]">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-4 border-green-500 rounded-lg w-4/5 h-2/3 flex items-center justify-center">
                <span className="text-white bg-black bg-opacity-80 px-4 py-2 rounded text-sm font-bold text-center">
                  Center the label
                  <br />
                  <span className="text-xs">
                    Scan {scannedWeights.length === 0 ? "first" : "next"} weight label
                  </span>
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={captureAndProcessImage}
              className="col-span-2"
              disabled={isProcessing}
              variant="default"
            >
              {isProcessing
                ? "🔍 Reading..."
                : `📷 Capture Weight #${scannedWeights.length + 1}`}
            </Button>

            {scannedWeights.length > 0 && (
              <Button
                onClick={finishScanning}
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                ✓ Done ({scannedWeights.length})
              </Button>
            )}

            <Button
              onClick={stopScanning}
              variant="destructive"
              className={scannedWeights.length > 0 ? "" : "col-span-2"}
            >
              Cancel
            </Button>
          </div>

          {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-900" />
                <p className="text-sm text-blue-900">Reading weight label...</p>
              </div>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-900 font-bold mb-1">
              📋 Multi-weight scanning:
            </p>
            <ul className="text-xs text-amber-800 space-y-1">
              <li>1. Scan first box/package weight</li>
              <li>2. Click "Capture" for each additional weight</li>
              <li>3. Total is calculated automatically</li>
              <li>4. Click "Done" when finished</li>
            </ul>
          </div>
        </div>
      )}
      {/* Debug Panel */}
      <div className="mt-2">
        <button
          onClick={() => setShowDebug((v) => !v)}
          className="text-xs text-gray-400 underline w-full text-left"
        >
          {showDebug ? "▲ Hide" : "▼ Show"} debug logs ({debugLogs.length})
        </button>

        {showDebug && (
          <div className="mt-1 bg-gray-950 rounded-lg p-3 max-h-64 overflow-y-auto">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-gray-400 font-mono">
                Production Debug Log
              </span>
              <button
                onClick={() => setDebugLogs([])}
                className="text-xs text-gray-500 hover:text-gray-300"
              >
                Clear
              </button>
            </div>
            {debugLogs.length === 0 ? (
              <p className="text-xs text-gray-500 font-mono">No logs yet. Capture a weight to start.</p>
            ) : (
              debugLogs.map((log, i) => (
                <p
                  key={i}
                  className={`text-xs font-mono leading-relaxed ${
                    log.includes("✓")
                      ? "text-green-400"
                      : log.includes("✗") || log.includes("Error")
                      ? "text-red-400"
                      : "text-gray-300"
                  }`}
                >
                  {log}
                </p>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
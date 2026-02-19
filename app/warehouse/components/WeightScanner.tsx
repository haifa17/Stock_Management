"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Tesseract from "tesseract.js";
import { Barcode, Scale, Trash2, CheckCircle } from "lucide-react";

interface WeightEntry {
  weight: number;
  unit: string;
}

interface WeightScannerProps {
  /** Called when the user finishes collecting weights. Receives individual entries and the total in the dominant unit. */
  onWeightDetected?: (weights: WeightEntry[], total: number, unit: string) => void;
  onBarcodeScanned?: (code: string) => void;
}

export function WeightScanner({
  onWeightDetected,
  onBarcodeScanned,
}: WeightScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<"barcode" | "weight">("barcode");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Multi-weight state
  const [collectedWeights, setCollectedWeights] = useState<WeightEntry[]>([]);
  const [lastDetected, setLastDetected] = useState<string | null>(null);

  const scannerRef = useRef<any>(null);
  const isRunningRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

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
          (decodedText) => {
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
  }, [isScanning, isMounted, scanMode, onBarcodeScanned]);

  // Weight scanning effect - START CAMERA
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

  const captureAndProcessImage = async () => {
    if (!videoRef.current || !canvasRef.current) {
      setError("Camera not ready");
      return;
    }

    setIsProcessing(true);
    setError("");
    setLastDetected(null);

    const video = videoRef.current;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    if (!context) {
      setIsProcessing(false);
      return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    context.putImageData(preprocessImageForOCR(imageData), 0, 0);
    const finalImage = canvas.toDataURL("image/png");

    try {
      const result = await Tesseract.recognize(finalImage, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const text = result.data.text;
      const weightInfo = extractWeight(text);

      if (weightInfo) {
        // Add to the list instead of closing
        setCollectedWeights((prev) => [...prev, weightInfo]);
        setLastDetected(`${weightInfo.weight} ${weightInfo.unit}`);
      } else {
        setError("Weight not detected. Try better lighting and positioning.");
      }
    } catch (err) {
      console.error("OCR Error:", err);
      setError("Error reading image");
    } finally {
      setIsProcessing(false);
    }
  };

  /** Normalize all weights to the dominant unit and compute the total. */
  const computeTotal = (): { total: number; unit: string } => {
    if (collectedWeights.length === 0) return { total: 0, unit: "LBS" };

    // Use the unit from the first entry as the reference
    const refUnit = collectedWeights[0].unit;

    const total = collectedWeights.reduce((sum, entry) => {
      if (entry.unit === refUnit) return sum + entry.weight;
      // Simple LBS <-> KG conversion
      if (refUnit === "LBS" && entry.unit === "KG")
        return sum + entry.weight * 2.20462;
      if (refUnit === "KG" && entry.unit === "LBS")
        return sum + entry.weight / 2.20462;
      return sum + entry.weight;
    }, 0);

    return { total: Math.round(total * 1000) / 1000, unit: refUnit };
  };

  const handleDone = () => {
    if (collectedWeights.length === 0) return;
    const { total, unit } = computeTotal();
    onWeightDetected?.(collectedWeights, total, unit);
    stopScanning();
    setCollectedWeights([]);
    setLastDetected(null);
  };

  const removeWeight = (index: number) => {
    setCollectedWeights((prev) => prev.filter((_, i) => i !== index));
  };

  const preprocessImageForOCR = (imageData: ImageData): ImageData => {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray =
        0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
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
    const cleanText = text.replace(/\s+/g, " ").trim();
    const patterns = [
      /NET\s*:?\s*(\d+\.?\d*)\s*(LBS?|KGS?|KGSS)/i,
      /WT\s*:?\s*(\d+\.?\d*)\s*(LBS?|KGS?|KGSS)/i,
      /WEIGHT\s*:?\s*(\d+\.?\d*)\s*(LBS?|KGS?|KGSS)/i,
      /(\d+\.?\d*)\s*(LBS?|KGS?|KGSS)/i,
    ];

    for (const pattern of patterns) {
      const match = cleanText.match(pattern);
      if (match) {
        const weight = parseFloat(match[1]);
        let unit = match[2].toUpperCase();
        if (unit.includes("LB")) unit = "LBS";
        if (unit.includes("KG")) unit = "KG";
        return { weight, unit };
      }
    }
    return null;
  };

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

  const { total, unit } = computeTotal();

  return (
    <div className="space-y-3">
      {/* Mode Selection Buttons */}
      {!isScanning && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => {
              setScanMode("barcode");
              setError("");
              setIsScanning(true);
            }}
            variant="secondary"
            className="w-full"
          >
            <Barcode /> BarCode
          </Button>
          <Button
            onClick={() => {
              setScanMode("weight");
              setError("");
              setCollectedWeights([]);
              setLastDetected(null);
              setIsScanning(true);
            }}
            variant="secondary"
            className="w-full"
          >
            <Scale /> Weight (OCR)
          </Button>
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
            Stop scanning.
          </Button>
        </>
      )}

      {/* Weight Scanner View */}
      {isScanning && scanMode === "weight" && (
        <div className="space-y-3">
          {/* Camera */}
          <div className="relative w-full rounded-lg overflow-hidden bg-black min-h-[260px]">
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
                <span className="text-white bg-black bg-opacity-70 px-4 py-2 rounded text-sm font-medium">
                  Center the label within the frame.
                </span>
              </div>
            </div>
          </div>

          {/* Capture button */}
          <div className="flex gap-2">
            <Button
              onClick={captureAndProcessImage}
              className="flex-1"
              disabled={isProcessing}
            >
              {isProcessing ? "Processing..." : "📷 Capture & Add"}
            </Button>
            <Button onClick={stopScanning} variant="destructive">
              Cancel
            </Button>
          </div>

          {/* Last detected flash */}
          {lastDetected && !isProcessing && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-2 text-center text-sm text-green-800 font-medium">
              ✅ Added: {lastDetected}
            </div>
          )}

          {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900 text-center">
                Image analysis in progress...
              </p>
            </div>
          )}

          {/* Collected weights list */}
          {collectedWeights.length > 0 && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                Collected weights ({collectedWeights.length})
              </p>

              <ul className="space-y-1">
                {collectedWeights.map((entry, i) => (
                  <li
                    key={i}
                    className="flex items-center justify-between bg-white border border-gray-100 rounded px-3 py-1.5 text-sm"
                  >
                    <span className="font-medium">
                      #{i + 1} — {entry.weight} {entry.unit}
                    </span>
                    <button
                      onClick={() => removeWeight(i)}
                      className="text-red-400 hover:text-red-600 ml-2"
                      title="Remove"
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>

              {/* Running total */}
              <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                <span className="text-sm font-semibold text-gray-700">
                  Total
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {total} {unit}
                </span>
              </div>

              {/* Done button */}
              <Button
                onClick={handleDone}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
              >
                <CheckCircle size={16} className="mr-2" />
                Done — Send {total} {unit}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600 text-center">{error}</p>
        </div>
      )}
    </div>
  );
}
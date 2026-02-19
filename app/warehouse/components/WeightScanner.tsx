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
  onWeightDetected?: (
    weights: WeightEntry[],
    total: number,
    unit: string,
  ) => void;
  onBarcodeScanned?: (code: string) => void;
}

export function WeightScanner({
  onWeightDetected,
  onBarcodeScanned,
}: WeightScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<"barcode" | "weight">("barcode");
  const [error, setError] = useState("");
  const [debugLog, setDebugLog] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [collectedWeights, setCollectedWeights] = useState<WeightEntry[]>([]);
  const [lastDetected, setLastDetected] = useState<string | null>(null);

  const scannerRef = useRef<any>(null);
  const isRunningRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Visible logger — shows on phone instead of console
  const log = (msg: string) => {
    console.log(msg);
    setDebugLog((prev) =>
      [`[${new Date().toLocaleTimeString()}] ${msg}`, ...prev].slice(0, 30),
    );
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // ── Barcode scanning ──
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
          (decodedText: string) => {
            log(`Barcode: ${decodedText}`);
            try {
              onBarcodeScanned?.(decodedText);
            } catch (e) {
              log(`onBarcodeScanned error: ${e}`);
            }
            isRunningRef.current = false;
            scanner.stop().catch(() => {});
            setIsScanning(false);
          },
          () => {},
        );

        isRunningRef.current = true;
      } catch (err) {
        log(`Barcode camera error: ${err}`);
        setError("Cannot access camera");
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

  // ── Weight camera ──
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
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          await videoRef.current.play();
          log("Camera started OK");
        }
      } catch (err) {
        log(`Weight camera error: ${err}`);
        setError("Unable to access the camera. Please check permissions.");
        setIsScanning(false);
      }
    };

    const timeout = setTimeout(startCamera, 100);
    return () => {
      isCancelled = true;
      clearTimeout(timeout);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    };
  }, [isScanning, isMounted, scanMode]);

  // ── Capture & OCR ──
  const captureAndProcessImage = async () => {
    try {
      if (!videoRef.current || !canvasRef.current) {
        setError("Camera not ready");
        return;
      }

      setIsProcessing(true);
      setError("");
      setLastDetected(null);
      log("Capturing...");

      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");
      if (!context) {
        log("No canvas context");
        setIsProcessing(false);
        return;
      }

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);
      log(`Frame: ${canvas.width}x${canvas.height}`);

      try {
        const imageData = context.getImageData(
          0,
          0,
          canvas.width,
          canvas.height,
        );
        context.putImageData(preprocessImageForOCR(imageData), 0, 0);
      } catch (e) {
        log(`Preprocess skipped: ${e}`);
      }

      const finalImage = canvas.toDataURL("image/png");
      log("OCR starting...");

      const result = await Tesseract.recognize(finalImage, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text")
            log(`OCR ${Math.round(m.progress * 100)}%`);
        },
      });

      const text = result.data.text ?? "";
      log(`Raw text: "${text.replace(/\n/g, " ").slice(0, 100)}"`);

      const weightInfo = extractWeight(text);
      if (weightInfo) {
        log(`✅ Found: ${weightInfo.weight} ${weightInfo.unit}`);
        setCollectedWeights((prev) => [...prev, weightInfo]);
        setLastDetected(`${weightInfo.weight} ${weightInfo.unit}`);
      } else {
        log("❌ No weight matched");
        setError("Weight not detected. Try better lighting and positioning.");
      }
    } catch (err) {
      log(`captureAndProcessImage CRASH: ${err}`);
      setError(
        `Capture error: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Compute total ──
  const computeTotal = (
    weights: WeightEntry[],
  ): { total: number; unit: string } => {
    try {
      if (!weights || weights.length === 0) return { total: 0, unit: "LBS" };
      const refUnit = weights[0]?.unit ?? "LBS";
      const total = weights.reduce((sum, entry) => {
        const w = Number(entry?.weight) || 0;
        if (entry.unit === refUnit) return sum + w;
        if (refUnit === "LBS" && entry.unit === "KG") return sum + w * 2.20462;
        if (refUnit === "KG" && entry.unit === "LBS") return sum + w / 2.20462;
        return sum + w;
      }, 0);
      return { total: Math.round(total * 1000) / 1000, unit: refUnit };
    } catch (e) {
      log(`computeTotal error: ${e}`);
      return { total: 0, unit: "LBS" };
    }
  };

  // ── Done handler — fully wrapped ──
  const handleDone = () => {
    try {
      log(`handleDone: ${collectedWeights.length} weights`);

      if (!collectedWeights || collectedWeights.length === 0) {
        setError("No weights collected yet.");
        return;
      }

      const snapshot = [...collectedWeights]; // copy before clearing
      const { total, unit } = computeTotal(snapshot);
      log(`Total computed: ${total} ${unit}`);

      if (typeof onWeightDetected === "function") {
        log("Calling onWeightDetected...");
        onWeightDetected(snapshot, total, unit);
        log("onWeightDetected done");
      } else {
        log("WARNING: onWeightDetected is not a function");
      }

      stopScanning();
      setCollectedWeights([]);
      setLastDetected(null);
    } catch (err) {
      log(
        `handleDone CRASH: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}`,
      );
      setError(
        `Done failed: ${err instanceof Error ? err.message : String(err)}`,
      );
    }
  };

  const removeWeight = (index: number) => {
    try {
      setCollectedWeights((prev) => prev.filter((_, i) => i !== index));
    } catch (e) {
      log(`removeWeight error: ${e}`);
    }
  };

  const preprocessImageForOCR = (imageData: ImageData): ImageData => {
    const data = imageData.data;
    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      let adj = gray < 128 ? gray * 0.5 : 128 + (gray - 128) * 1.5;
      adj = Math.min(255, Math.max(0, adj));
      data[i] = adj;
      data[i + 1] = adj;
      data[i + 2] = adj;
    }
    return imageData;
  };

  const extractWeight = (
    text: string,
  ): { weight: number; unit: string } | null => {
    try {
      const clean = (text ?? "").replace(/\s+/g, " ").trim();
      const patterns = [
        /NET\s*:?\s*(\d+\.?\d*)\s*(LBS?|KGS?|KGSS)/i,
        /WT\s*:?\s*(\d+\.?\d*)\s*(LBS?|KGS?|KGSS)/i,
        /WEIGHT\s*:?\s*(\d+\.?\d*)\s*(LBS?|KGS?|KGSS)/i,
        /(\d+\.?\d*)\s*(LBS?|KGS?|KGSS)/i,
      ];
      for (const pattern of patterns) {
        const match = clean.match(pattern);
        if (match) {
          const weight = parseFloat(match[1]);
          let unit = match[2].toUpperCase();
          if (unit.includes("LB")) unit = "LBS";
          if (unit.includes("KG")) unit = "KG";
          if (!isNaN(weight) && weight > 0) return { weight, unit };
        }
      }
    } catch (e) {
      log(`extractWeight error: ${e}`);
    }
    return null;
  };

  const stopScanning = () => {
    try {
      if (
        scanMode === "barcode" &&
        scannerRef.current &&
        isRunningRef.current
      ) {
        scannerRef.current.stop().catch(() => {});
        isRunningRef.current = false;
      }
      if (scanMode === "weight") {
        streamRef.current?.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        if (videoRef.current) videoRef.current.srcObject = null;
      }
    } catch (e) {
      log(`stopScanning error: ${e}`);
    }
    setIsScanning(false);
  };

  if (!isMounted) return null;

  const { total, unit } = computeTotal(collectedWeights);

  return (
    <div className="space-y-3">
      {/* Mode buttons */}
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

      {/* Barcode view */}
      {isScanning && scanMode === "barcode" && (
        <>
          <div
            id="qr-reader"
            className="w-full rounded-lg overflow-hidden min-h-[300px] bg-black"
          />
          <Button
            onClick={stopScanning}
            className="w-full"
            variant="destructive"
          >
            Stop scanning.
          </Button>
        </>
      )}

      {/* Weight view */}
      {isScanning && scanMode === "weight" && (
        <div className="space-y-3">
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

          {/* Weights list + Done */}
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
                    >
                      <Trash2 size={14} />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between pt-1 border-t border-gray-200">
                <span className="text-sm font-semibold text-gray-700">
                  Total
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {total} {unit}
                </span>
              </div>
              <Button
                onClick={handleDone}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                disabled={isProcessing}
              >
                <CheckCircle size={16} className="mr-2" />
                Done — Send {total} {unit}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600 text-center">{error}</p>
        </div>
      )}
    </div>
  );
}

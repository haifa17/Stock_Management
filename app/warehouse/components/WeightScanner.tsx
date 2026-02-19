"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Tesseract from "tesseract.js";
import { Barcode, Scale, Trash2, CheckCircle, Camera } from "lucide-react";

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

// ── Persistent crash logger ───────────────────────────────────────────────────
const CRASH_LOG_KEY = "weightscanner_crashlog";
function persistLog(msg: string) {
  try {
    const prev = JSON.parse(localStorage.getItem(CRASH_LOG_KEY) || "[]");
    localStorage.setItem(
      CRASH_LOG_KEY,
      JSON.stringify(
        [`[${new Date().toISOString()}] ${msg}`, ...prev].slice(0, 50),
      ),
    );
    console.log(msg);
  } catch (_) {}
}
function readCrashLog(): string[] {
  try {
    return JSON.parse(localStorage.getItem(CRASH_LOG_KEY) || "[]");
  } catch {
    return [];
  }
}
function clearCrashLog() {
  try {
    localStorage.removeItem(CRASH_LOG_KEY);
  } catch (_) {}
}
// ─────────────────────────────────────────────────────────────────────────────

export function WeightScanner({
  onWeightDetected,
  onBarcodeScanned,
}: WeightScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [scanMode, setScanMode] = useState<"barcode" | "weight">("barcode");
  const [error, setError] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [collectedWeights, setCollectedWeights] = useState<WeightEntry[]>([]);
  const [lastDetected, setLastDetected] = useState<string | null>(null);
  const [showLog, setShowLog] = useState(false);
  const [logLines, setLogLines] = useState<string[]>([]);

  // Barcode camera refs (photo-capture mode)
  const barcodeVideoRef = useRef<HTMLVideoElement>(null);
  const barcodeCanvasRef = useRef<HTMLCanvasElement>(null);
  const barcodeStreamRef = useRef<MediaStream | null>(null);

  // Weight camera refs
  const weightVideoRef = useRef<HTMLVideoElement>(null);
  const weightCanvasRef = useRef<HTMLCanvasElement>(null);
  const weightStreamRef = useRef<MediaStream | null>(null);

  const log = (msg: string) => {
    persistLog(msg);
    setLogLines(readCrashLog());
  };

  useEffect(() => {
    setIsMounted(true);
    const existing = readCrashLog();
    if (existing.length > 0) setLogLines(existing);
  }, []);

  // ── Start barcode camera (photo-capture mode) ─────────────────────────────
  useEffect(() => {
    if (!isScanning || !isMounted || scanMode !== "barcode") return;
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
        if (barcodeVideoRef.current) {
          barcodeVideoRef.current.srcObject = stream;
          barcodeStreamRef.current = stream;
          await barcodeVideoRef.current.play();
          log("Barcode camera started");
        }
      } catch (err) {
        log(`Barcode camera error: ${err}`);
        setError("Cannot access camera. Check permissions.");
        setIsScanning(false);
      }
    };

    const timeout = setTimeout(startCamera, 100);
    return () => {
      isCancelled = true;
      clearTimeout(timeout);
      barcodeStreamRef.current?.getTracks().forEach((t) => t.stop());
      barcodeStreamRef.current = null;
      if (barcodeVideoRef.current) barcodeVideoRef.current.srcObject = null;
    };
  }, [isScanning, isMounted, scanMode]);

  // ── Capture photo and decode barcode ─────────────────────────────────────
  const captureAndDecodeBarcode = async () => {
    if (!barcodeVideoRef.current || !barcodeCanvasRef.current) {
      setError("Camera not ready");
      return;
    }

    setIsProcessing(true);
    setError("");
    log("Capturing barcode photo...");

    const video = barcodeVideoRef.current;
    const canvas = barcodeCanvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsProcessing(false);
      return;
    }

    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    log(`Captured: ${canvas.width}x${canvas.height}`);

    try {
      const { BrowserMultiFormatReader } = await import("@zxing/browser");
      const { DecodeHintType, BarcodeFormat } = await import("@zxing/library");

      const hints = new Map();
      hints.set(DecodeHintType.POSSIBLE_FORMATS, [
        BarcodeFormat.CODE_128, // GS1-128
        BarcodeFormat.CODE_39,
        BarcodeFormat.CODE_93,
        BarcodeFormat.EAN_13,
        BarcodeFormat.EAN_8,
        BarcodeFormat.UPC_A,
        BarcodeFormat.UPC_E,
        BarcodeFormat.ITF,
        BarcodeFormat.RSS_14,
        BarcodeFormat.RSS_EXPANDED,
        BarcodeFormat.PDF_417,
        BarcodeFormat.QR_CODE,
        BarcodeFormat.DATA_MATRIX,
      ]);
      hints.set(DecodeHintType.TRY_HARDER, true); // critical for dense barcodes

      const reader = new BrowserMultiFormatReader(hints);

      // Try original image first
      let decoded: string | null = null;

      const attempts = [
        () => canvas.toDataURL("image/png"), // original
        () => applyContrast(canvas, ctx, 1.5), // high contrast
        () => applyContrast(canvas, ctx, 2.0), // very high contrast
        () => cropBarcode(canvas, ctx, video.videoWidth, video.videoHeight), // crop bottom third
      ];

      for (let i = 0; i < attempts.length; i++) {
        try {
          const dataUrl = attempts[i]();
          log(`Attempt ${i + 1}...`);
          const img = await loadImage(dataUrl);
          const result = await reader.decodeFromImageElement(img);
          decoded = result.getText();
          log(`✅ Decoded on attempt ${i + 1}: ${decoded}`);
          break;
        } catch (e) {
          log(`Attempt ${i + 1} failed: no barcode found`);
        }
      }

      if (decoded) {
        try {
          onBarcodeScanned?.(decoded);
        } catch (e) {
          log(`onBarcodeScanned error: ${e}`);
        }
        stopScanning();
      } else {
        setError(
          "Barcode not detected. Make sure the barcode fills the frame and try again.",
        );
      }
    } catch (err) {
      log(
        `Barcode decode CRASH: ${err instanceof Error ? err.message : String(err)}`,
      );
      setError(
        `Decode error: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  // ── Image helpers ─────────────────────────────────────────────────────────

  /** Returns a high-contrast grayscale version of the canvas as a data URL */
  const applyContrast = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    factor: number,
  ): string => {
    // Re-draw original then process
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imgData.data;
    for (let i = 0; i < d.length; i += 4) {
      const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
      const adjusted = Math.min(255, Math.max(0, (gray - 128) * factor + 128));
      d[i] = adjusted;
      d[i + 1] = adjusted;
      d[i + 2] = adjusted;
    }
    ctx.putImageData(imgData, 0, 0);
    return canvas.toDataURL("image/png");
  };

  /** Crops to the bottom third of the image where GS1-128 usually lives */
  const cropBarcode = (
    canvas: HTMLCanvasElement,
    ctx: CanvasRenderingContext2D,
    w: number,
    h: number,
  ): string => {
    const cropCanvas = document.createElement("canvas");
    cropCanvas.width = w;
    cropCanvas.height = Math.floor(h / 3);
    const cropCtx = cropCanvas.getContext("2d")!;
    cropCtx.drawImage(
      canvas,
      0,
      Math.floor((h * 2) / 3),
      w,
      Math.floor(h / 3),
      0,
      0,
      w,
      Math.floor(h / 3),
    );
    return cropCanvas.toDataURL("image/png");
  };

  /** Loads a data URL into an HTMLImageElement */
  const loadImage = (dataUrl: string): Promise<HTMLImageElement> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = dataUrl;
    });

  // ── Weight camera ─────────────────────────────────────────────────────────
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
        if (weightVideoRef.current) {
          weightVideoRef.current.srcObject = stream;
          weightStreamRef.current = stream;
          await weightVideoRef.current.play();
          log("Weight camera started");
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
      weightStreamRef.current?.getTracks().forEach((t) => t.stop());
      weightStreamRef.current = null;
      if (weightVideoRef.current) weightVideoRef.current.srcObject = null;
    };
  }, [isScanning, isMounted, scanMode]);

  // ── Capture & OCR weight ──────────────────────────────────────────────────
  const captureAndProcessImage = async () => {
    try {
      if (!weightVideoRef.current || !weightCanvasRef.current) {
        setError("Camera not ready");
        return;
      }
      setIsProcessing(true);
      setError("");
      setLastDetected(null);
      log("Capturing weight frame...");

      const video = weightVideoRef.current;
      const canvas = weightCanvasRef.current;
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        log("No canvas context");
        setIsProcessing(false);
        return;
      }

      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      try {
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        ctx.putImageData(preprocessImageForOCR(imageData), 0, 0);
      } catch (e) {
        log(`Preprocess skipped: ${e}`);
      }

      const finalImage = canvas.toDataURL("image/png");
      const result = await Tesseract.recognize(finalImage, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text")
            log(`OCR ${Math.round(m.progress * 100)}%`);
        },
      });

      const text = result.data.text ?? "";
      log(`OCR: "${text.replace(/\n/g, " ").slice(0, 120)}"`);

      const weightInfo = extractWeight(text);
      if (weightInfo) {
        log(`✅ Weight: ${weightInfo.weight} ${weightInfo.unit}`);
        setCollectedWeights((prev) => [...prev, weightInfo]);
        setLastDetected(`${weightInfo.weight} ${weightInfo.unit}`);
      } else {
        log("❌ No weight pattern matched");
        setError("Weight not detected. Try better lighting and positioning.");
      }
    } catch (err) {
      log(
        `Weight capture CRASH: ${err instanceof Error ? (err.stack ?? err.message) : String(err)}`,
      );
      setError(
        `Capture error: ${err instanceof Error ? err.message : String(err)}`,
      );
    } finally {
      setIsProcessing(false);
    }
  };

  const computeTotal = (
    weights: WeightEntry[],
  ): { total: number; unit: string } => {
    try {
      if (!weights?.length) return { total: 0, unit: "LBS" };
      const refUnit = weights[0]?.unit ?? "LBS";
      const total = weights.reduce((sum, e) => {
        const w = Number(e?.weight) || 0;
        if (e.unit === refUnit) return sum + w;
        if (refUnit === "LBS" && e.unit === "KG") return sum + w * 2.20462;
        if (refUnit === "KG" && e.unit === "LBS") return sum + w / 2.20462;
        return sum + w;
      }, 0);
      return { total: Math.round(total * 1000) / 1000, unit: refUnit };
    } catch (e) {
      log(`computeTotal error: ${e}`);
      return { total: 0, unit: "LBS" };
    }
  };

  const handleDone = () => {
    log("=== handleDone START ===");
    try {
      if (!Array.isArray(collectedWeights) || collectedWeights.length === 0) {
        setError("No weights collected yet.");
        return;
      }
      const snapshot = collectedWeights.map((e) => ({
        weight: Number(e.weight),
        unit: String(e.unit),
      }));
      const { total, unit } = computeTotal(snapshot);
      log(`Total: ${total} ${unit}`);
      if (typeof onWeightDetected === "function") {
        onWeightDetected(snapshot, total, unit);
        log("onWeightDetected OK");
      }
      stopScanning();
      setCollectedWeights([]);
      setLastDetected(null);
      log("=== handleDone COMPLETE ===");
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
        /NET\s*WT\.?\s*:?\s*(\d+\.?\d*)\s*(LBS?|KGS?)/i,
        /NET\s*:?\s*(\d+\.?\d*)\s*(LBS?|KGS?)/i,
        /WT\s*\.?\s*:?\s*(\d+\.?\d*)\s*(LBS?|KGS?)/i,
        /WEIGHT\s*:?\s*(\d+\.?\d*)\s*(LBS?|KGS?)/i,
        /(\d+\.?\d*)\s*(LBS?|KGS?)/i,
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
      if (scanMode === "barcode") {
        barcodeStreamRef.current?.getTracks().forEach((t) => t.stop());
        barcodeStreamRef.current = null;
        if (barcodeVideoRef.current) barcodeVideoRef.current.srcObject = null;
      }
      if (scanMode === "weight") {
        weightStreamRef.current?.getTracks().forEach((t) => t.stop());
        weightStreamRef.current = null;
        if (weightVideoRef.current) weightVideoRef.current.srcObject = null;
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
            className="w-full cursor-pointer"
          >
            <Barcode className="mr-2" /> BarCode
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
            className="w-full cursor-pointer"
          >
            <Scale className="mr-2" /> Weight (OCR)
          </Button>
        </div>
      )}

      {/* ── Barcode view — photo capture mode ── */}
      {isScanning && scanMode === "barcode" && (
        <div className="space-y-3">
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
            <p className="text-xs text-amber-800 text-center font-medium">
              📦 Point at the <strong>long bottom barcode</strong> · fill the
              frame · tap Capture
            </p>
          </div>

          <div className="relative w-full rounded-lg overflow-hidden bg-black min-h-[300px]">
            <video
              ref={barcodeVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={barcodeCanvasRef} className="hidden" />

            {/* Targeting overlay — horizontal strip for GS1-128 */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div
                className="w-11/12 border-4 border-green-400 rounded"
                style={{ height: "72px" }}
              >
                <span className="block text-center text-white text-xs bg-black bg-opacity-60 py-0.5 mt-1 mx-2 rounded">
                  Align barcode here
                </span>
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={captureAndDecodeBarcode}
              className="flex-1"
              disabled={isProcessing}
            >
              {isProcessing ? (
                "Decoding..."
              ) : (
                <>
                  <Camera size={16} className="mr-2" /> Capture & Decode
                </>
              )}
            </Button>
            <Button onClick={stopScanning} variant="destructive">
              Cancel
            </Button>
          </div>

          {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900 text-center">
                Trying multiple decode strategies...
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Weight view ── */}
      {isScanning && scanMode === "weight" && (
        <div className="space-y-3">
          <div className="relative w-full rounded-lg overflow-hidden bg-black min-h-[260px]">
            <video
              ref={weightVideoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={weightCanvasRef} className="hidden" />
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

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm text-red-600 text-center">{error}</p>
        </div>
      )}
    </div>
  );
}

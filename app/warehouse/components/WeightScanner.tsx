"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
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
  const [scannedWeights, setScannedWeights] = useState<ScannedWeight[]>([]);
  const [totalWeight, setTotalWeight] = useState(0);

  const scannerRef = useRef<any>(null);
  const isRunningRef = useRef(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const onWeightDetectedRef = useRef(onWeightDetected);

  useEffect(() => {
    onWeightDetectedRef.current = onWeightDetected;
  }, [onWeightDetected]);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const log = (message: string) => {
    console.log(message);
    setDebugLogs((prev) => [
      `[${new Date().toLocaleTimeString()}] ${message}`,
      ...prev.slice(0, 49),
    ]);
  };

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setError("");
    setTimeout(() => setSuccessMessage(""), 4000);
  };

  const showError = (message: string) => {
    setError(message);
    setSuccessMessage("");
  };

  // Total weight calculation
  useEffect(() => {
    if (scannedWeights.length > 0) {
      const total = scannedWeights.reduce((sum, item) => {
        const weightInLbs = item.unit === "KG" ? item.weight * 2.20462 : item.weight;
        return sum + weightInLbs;
      }, 0);
      setTotalWeight(total);
      try {
        onWeightDetectedRef.current?.(total, "LBS", `Total of ${scannedWeights.length} weights`);
      } catch (err: any) {
        log(`onWeightDetected callback error: ${err.message}`);
      }
    } else {
      setTotalWeight(0);
    }
  }, [scannedWeights]);

  // Barcode scanning
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
          { fps: 30, qrbox: { width: 400, height: 200 }, aspectRatio: 2.0 },
          (decodedText: string) => {
            log(`Barcode scanned: ${decodedText}`);
            onBarcodeScanned?.(decodedText);
            isRunningRef.current = false;
            scanner.stop().catch(() => {});
            setIsScanning(false);
          },
          () => {},
        );
        isRunningRef.current = true;
      } catch (err: any) {
        log(`Barcode scanner error: ${err.message}`);
        showError("Unable to access camera");
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

  // Camera for weight scanning
  useEffect(() => {
    if (!isScanning || !isMounted || scanMode !== "weight") return;
    let isCancelled = false;

    const startCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1920 }, height: { ideal: 1080 } },
        });
        if (isCancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          streamRef.current = stream;
          await videoRef.current.play();
          log("Camera started");
        }
      } catch (err: any) {
        log(`Camera error: ${err.message}`);
        showError("Unable to access camera. Please check permissions.");
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

  // ── Claude Vision OCR via server API route — no Web Workers, works on iOS Safari ──
  const readWeightWithClaude = async (base64Image: string): Promise<{ weight: number; unit: string } | null> => {
    log("Sending image to /api/read-weight...");

    const response = await fetch("/api/read-weight", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ base64Image }),
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      throw new Error(data.error ?? `Server error ${response.status}` + (data.detail ? `: ${data.detail}` : ""));
    }

    const claudeText: string = data.claudeText ?? "";
    log(`Claude raw text: "${claudeText}"`);

    if (!claudeText.trim()) {
      throw new Error("Claude returned an empty response");
    }

    // Strip markdown fences if Claude added them despite instructions
    const cleaned = claudeText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    // Extract first {...} JSON block in case there is surrounding text
    const jsonMatch = cleaned.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      log(`No JSON object found in: "${cleaned}"`);
      throw new Error(`Could not find JSON in Claude response: "${cleaned.substring(0, 100)}"`);
    }

    let parsed: any;
    try {
      parsed = JSON.parse(jsonMatch[0]);
    } catch (e: any) {
      log(`JSON parse failed on: "${jsonMatch[0]}"`);
      throw new Error(`JSON parse error: ${e.message} — raw: "${jsonMatch[0].substring(0, 100)}"`);
    }

    if (parsed.error || parsed.weight === null || parsed.weight === undefined) {
      log(`Claude could not find weight: ${parsed.error ?? "no weight field"}`);
      return null;
    }

    const weight = parseFloat(parsed.weight);
    const unit = String(parsed.unit ?? "").toUpperCase();

    if (isNaN(weight) || weight <= 0 || weight > 99999) {
      log(`Invalid weight value: ${weight}`);
      return null;
    }
    if (unit !== "LBS" && unit !== "KG") {
      log(`Invalid unit: "${unit}"`);
      return null;
    }

    return { weight, unit };
  };

  const captureAndProcessImage = async () => {
    if (!videoRef.current || !canvasRef.current) {
      showError("Camera not ready");
      return;
    }

    setIsProcessing(true);
    setError("");
    setSuccessMessage("");

    try {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext("2d");

      if (!context) {
        showError("Canvas not available");
        return;
      }

      // Scale down for faster upload on mobile
      const MAX_DIM = 1280;
      const scale = Math.min(1, MAX_DIM / Math.max(video.videoWidth, video.videoHeight));
      canvas.width = video.videoWidth * scale;
      canvas.height = video.videoHeight * scale;
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      const base64Full = canvas.toDataURL("image/jpeg", 0.85);
      const base64Data = base64Full.split(",")[1];
      log(`Image captured: ${canvas.width}x${canvas.height}, ~${Math.round(base64Data.length / 1024)}KB`);

      const weightInfo = await readWeightWithClaude(base64Data);

      if (weightInfo) {
        const newWeight: ScannedWeight = {
          id: Date.now().toString(),
          weight: weightInfo.weight,
          unit: weightInfo.unit,
          timestamp: Date.now(),
        };
        setScannedWeights((prev) => [...prev, newWeight]);
        showSuccess(`✓ Weight added: ${weightInfo.weight} ${weightInfo.unit}`);
        log(`✓ Added: ${weightInfo.weight} ${weightInfo.unit}`);
      } else {
        showError("Weight not detected. Make sure the label is clearly visible and well-lit.");
      }
    } catch (err: any) {
      log(`Error: ${err.message}`);
      showError(`Failed to read weight: ${err.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const removeWeight = (id: string) => {
    setScannedWeights((prev) => prev.filter((w) => w.id !== id));
  };

  const clearAllWeights = () => {
    setScannedWeights([]);
    setError("");
    setSuccessMessage("");
  };

  const stopScanning = () => {
    if (scanMode === "barcode" && scannerRef.current && isRunningRef.current) {
      scannerRef.current.stop().catch(() => {});
      isRunningRef.current = false;
    }
    if (scanMode === "weight") {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
      if (videoRef.current) videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  };

  if (!isMounted) return null;

  return (
    <div className="space-y-3">
      {/* Mode buttons */}
      {!isScanning && (
        <div className="grid grid-cols-2 gap-2">
          <Button
            onClick={() => { setScanMode("barcode"); setError(""); setSuccessMessage(""); setIsScanning(true); }}
            variant="secondary"
            className="w-full"
          >
            <Barcode className="mr-2 h-4 w-4" /> Barcode
          </Button>
          <Button
            onClick={() => { setScanMode("weight"); setError(""); setSuccessMessage(""); setScannedWeights([]); setIsScanning(true); }}
            variant="secondary"
            className="w-full"
          >
            <Scale className="mr-2 h-4 w-4" /> Weight (AI)
          </Button>
        </div>
      )}

      {/* Success banner */}
      {successMessage && (
        <div className="flex items-center gap-2 bg-green-50 border border-green-400 rounded-lg p-3">
          <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
          <p className="text-sm font-semibold text-green-800">{successMessage}</p>
        </div>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-300 rounded-lg p-3">
          <XCircle className="h-5 w-5 text-red-500 shrink-0" />
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* Scanned weights summary */}
      {scannedWeights.length > 0 && !isScanning && (
        <div className="bg-green-50 border-2 border-green-300 rounded-lg p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-green-900">⚖️ Scanned Weights ({scannedWeights.length})</h3>
            <Button onClick={clearAllWeights} size="sm" variant="ghost" className="text-red-600 hover:bg-red-50">
              <Trash2 className="h-4 w-4 mr-1" /> Clear All
            </Button>
          </div>
          <div className="space-y-2 mb-3">
            {scannedWeights.map((item, index) => (
              <div key={item.id} className="flex items-center justify-between bg-white rounded p-2 text-sm">
                <span className="text-gray-700">
                  #{index + 1}: <strong>{item.weight} {item.unit}</strong>
                  {item.unit === "KG" && (
                    <span className="text-gray-500 ml-2">({(item.weight * 2.20462).toFixed(2)} LBS)</span>
                  )}
                </span>
                <Button onClick={() => removeWeight(item.id)} size="sm" variant="ghost" className="h-6 w-6 p-0 text-red-600 hover:bg-red-50">
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
          <div className="bg-green-100 rounded-lg p-3 border border-green-300 text-center">
            <p className="text-xs text-green-700 mb-1">Total Weight</p>
            <p className="text-2xl font-bold text-green-900">{totalWeight.toFixed(2)} LBS</p>
          </div>
        </div>
      )}

      {/* Barcode scanner */}
      {isScanning && scanMode === "barcode" && (
        <>
          <div id="qr-reader" className="w-full rounded-lg overflow-hidden min-h-[300px] bg-black" />
          <Button onClick={stopScanning} className="w-full" variant="destructive">Stop Scanning</Button>
        </>
      )}

      {/* Weight scanner */}
      {isScanning && scanMode === "weight" && (
        <div className="space-y-3">
          {scannedWeights.length > 0 && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-center">
              <p className="text-sm text-blue-900 font-medium">
                ✓ {scannedWeights.length} weight{scannedWeights.length !== 1 ? "s" : ""} scanned •{" "}
                Total: <strong>{totalWeight.toFixed(2)} LBS</strong>
              </p>
              <p className="text-xs text-blue-700 mt-1">Scan more or click Done</p>
            </div>
          )}

          <div className="relative w-full rounded-lg overflow-hidden bg-black min-h-[300px]">
            <video ref={videoRef} className="w-full h-full object-cover" autoPlay playsInline muted />
            <canvas ref={canvasRef} className="hidden" />
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="border-4 border-green-500 rounded-lg w-4/5 h-2/3 flex items-center justify-center">
                <span className="text-white bg-black bg-opacity-80 px-4 py-2 rounded text-sm font-bold text-center">
                  Center the label<br />
                  <span className="text-xs">Scan {scannedWeights.length === 0 ? "first" : "next"} weight label</span>
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button onClick={captureAndProcessImage} className="col-span-2" disabled={isProcessing}>
              {isProcessing ? "🤖 AI Reading..." : `📷 Capture Weight #${scannedWeights.length + 1}`}
            </Button>
            {scannedWeights.length > 0 && (
              <Button onClick={stopScanning} variant="default" className="bg-green-600 hover:bg-green-700">
                ✓ Done ({scannedWeights.length})
              </Button>
            )}
            <Button onClick={stopScanning} variant="destructive" className={scannedWeights.length > 0 ? "" : "col-span-2"}>
              Cancel
            </Button>
          </div>

          {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center gap-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-900" />
              <p className="text-sm text-blue-900">AI is reading the label...</p>
            </div>
          )}

          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <p className="text-xs text-amber-900 font-bold mb-1">📋 Multi-weight scanning:</p>
            <ul className="text-xs text-amber-800 space-y-1">
              <li>1. Point camera at the weight label</li>
              <li>2. Click Capture — AI reads it automatically</li>
              <li>3. Repeat for each package</li>
              <li>4. Click Done when finished</li>
            </ul>
          </div>
        </div>
      )}

      {/* Debug panel */}
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
              <span className="text-xs text-gray-400 font-mono">Production Debug Log</span>
              <button onClick={() => setDebugLogs([])} className="text-xs text-gray-500 hover:text-gray-300">Clear</button>
            </div>
            {debugLogs.length === 0 ? (
              <p className="text-xs text-gray-500 font-mono">No logs yet.</p>
            ) : (
              debugLogs.map((entry, i) => (
                <p
                  key={i}
                  className={`text-xs font-mono leading-relaxed break-all ${
                    entry.includes("✓") ? "text-green-400"
                    : entry.includes("✗") || entry.includes("Error") || entry.includes("error") ? "text-red-400"
                    : "text-gray-300"
                  }`}
                >
                  {entry}
                </p>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
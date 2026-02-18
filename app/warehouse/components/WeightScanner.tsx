"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import Tesseract from "tesseract.js";
import { Barcode, Scale } from "lucide-react";

interface WeightScannerProps {
  onWeightDetected?: (weight: number, unit: string, fullText: string) => void;
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
          {
            facingMode: "environment",
            width: { ideal: 1920 },
            height: { ideal: 1080 },
          },
          {
            fps: 30,
            qrbox: { width: 300, height: 80 }, // Wider box for barcodes (horizontal)
            aspectRatio: 2.0, // Horizontal rectangle for barcodes
            disableFlip: false, // Allow flipping for better detection
          },
          (decodedText, decodedResult) => {
            console.log("Scanned code:", decodedText);
            console.log("Format:", decodedResult.result.format);

            onBarcodeScanned?.(decodedText);
            isRunningRef.current = false;
            scanner.stop().catch(() => {});
            setIsScanning(false);
          },
          (errorMessage) => {
            // Suppress frequent scanning errors in console
          },
        );

        isRunningRef.current = true;
        console.log("✓ Scanner started - supports QR codes and barcodes");
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
        console.log("Starting weight scanner camera...");

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
          console.log("Camera started successfully");
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

    // Apply image preprocessing
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const processedImageData = preprocessImageForOCR(imageData);
    context.putImageData(processedImageData, 0, 0);

    const finalImage = canvas.toDataURL("image/png");

    try {
      console.log("Starting OCR with preprocessing...");

      const result = await Tesseract.recognize(finalImage, "eng", {
        logger: (m) => {
          if (m.status === "recognizing text") {
            console.log(`OCR Progress: ${Math.round(m.progress * 100)}%`);
          }
        },
      });

      const text = result.data.text;
      console.log("OCR Result:", text);
      console.log("Confidence:", result.data.confidence);

      const weightInfo = extractWeight(text);

      if (weightInfo) {
        onWeightDetected?.(weightInfo.weight, weightInfo.unit, text);
        stopScanning();
      } else {
        console.log("Failed to extract weight from:", text);
        setError(`Weight not detected. Try better lighting and positioning.`);
      }
    } catch (err) {
      console.error("OCR Error:", err);
      setError("Error reading image");
    } finally {
      setIsProcessing(false);
    }
  };

  const preprocessImageForOCR = (imageData: ImageData): ImageData => {
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
      const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];

      let adjusted = gray;
      if (adjusted < 128) {
        adjusted = adjusted * 0.5;
      } else {
        adjusted = 128 + (adjusted - 128) * 1.5;
      }

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
    console.log("Cleaned text:", cleanText);

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

        console.log("Weight extracted:", weight, unit);
        return { weight, unit };
      }
    }

    console.log("No weight pattern matched");
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

  if (!isMounted) {
    return null;
  }

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
          <Button
            onClick={stopScanning}
            className="w-full"
            variant="destructive"
          >
            Stop scanning.
          </Button>
        </>
      )}

      {/* Weight Scanner View */}
      {isScanning && scanMode === "weight" && (
        <div className="space-y-3">
          <div className="relative w-full rounded-lg overflow-hidden bg-black min-h-[300px]">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              autoPlay
              playsInline
              muted
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Overlay guide */}
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
              {isProcessing ? "Processing..." : "📷 Capture & Read"}
            </Button>
            <Button onClick={stopScanning} variant="destructive">
              Cancel
            </Button>
          </div>

          {isProcessing && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-sm text-blue-900 text-center">
                Image analysis in progress...
              </p>
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

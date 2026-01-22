"use client";

import { useRef, useState } from "react";
import { BrowserMultiFormatReader, IScannerControls } from "@zxing/browser";
import { Button } from "@/components/ui/button";

export function BarcodeScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState("");

  const startScan = async () => {
    setResult("");

    // ✅ SAFARI-SAFE CAMERA OPEN
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: "environment" }, // simple only
      },
      audio: false,
    });

    streamRef.current = stream;

    const video = videoRef.current!;
    video.srcObject = stream;
    await video.play();

    const reader = new BrowserMultiFormatReader();

    const controls = await reader.decodeFromVideoElement(video, (res, err) => {
      if (res) {
        setResult(res.getText());
        stopScan();
      }
    });

    controlsRef.current = controls;
    setScanning(true);
  };

  const stopScan = () => {
    controlsRef.current?.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setScanning(false);
  };

  return (
    <div className="space-y-4">
      {!scanning && (
        <Button onClick={startScan} className="w-full">
          📷 Scanner code-barres
        </Button>
      )}

      {scanning && (
        <>
          <video
            ref={videoRef}
            playsInline
            muted
            autoPlay
            className="w-full rounded-lg bg-black"
            style={{ height: 350 }}
          />

          <Button variant="destructive" className="w-full" onClick={stopScan}>
            ❌ Arrêter
          </Button>
        </>
      )}
    </div>
  );
}

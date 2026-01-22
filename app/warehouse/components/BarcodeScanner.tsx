"use client";

import { useRef, useState } from "react";
import {
  BrowserMultiFormatReader,
  IScannerControls,
} from "@zxing/browser";
import { Button } from "@/components/ui/button";

export function BarcodeScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const controlsRef = useRef<IScannerControls | null>(null);

  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState("");

  const startScan = async () => {
    setResult("");

    const codeReader = new BrowserMultiFormatReader();

    const controls = await codeReader.decodeFromVideoDevice(
      undefined, // back camera auto
      videoRef.current!,
      (res, err) => {
        if (res) {
          setResult(res.getText());
          stopScan();
        }
      }
    );

    controlsRef.current = controls;
    setScanning(true);
  };

  const stopScan = () => {
    controlsRef.current?.stop(); // ✅ CORRECT
    controlsRef.current = null;
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
            className="w-full rounded-lg bg-black"
            style={{ height: 350 }}
            playsInline
            muted
            autoPlay
          />

          <Button
            variant="destructive"
            className="w-full"
            onClick={stopScan}
          >
            ❌ Arrêter
          </Button>
        </>
      )}

      {result && (
        <div className="p-4 bg-green-50 border rounded">
          ✅ Code scanné :
          <div className="font-mono font-bold break-all mt-2">
            {result}
          </div>
        </div>
      )}
    </div>
  );
}

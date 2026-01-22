"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"

export function BarcodeScanner() {
  const [scannedCode, setScannedCode] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState("")
  const [isMounted, setIsMounted] = useState(false)
  const scannerRef = useRef<any>(null)

  // Ensure component is mounted before rendering
  useEffect(() => {
    setIsMounted(true)
  }, [])

  useEffect(() => {
    if (!isScanning || !isMounted) return

    const startScanner = async () => {
      try {
        // Dynamic import to avoid SSR issues
        const { Html5Qrcode } = await import("html5-qrcode")
        
        const scanner = new Html5Qrcode("qr-reader")
        scannerRef.current = scanner

        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            setScannedCode(decodedText)
            scanner.stop().catch(console.error)
            setIsScanning(false)
          },
          (errorMessage) => {
            // Normal errors during scanning - can be ignored
          }
        )
      } catch (err) {
        console.error(err)
        setError("Impossible d'accéder à la caméra")
        setIsScanning(false)
      }
    }

    const timeout = setTimeout(startScanner, 100)

    return () => {
      clearTimeout(timeout)
      if (scannerRef.current) {
        scannerRef.current.stop().catch(console.error)
      }
    }
  }, [isScanning, isMounted])

  // Don't render scanner UI until mounted (prevents hydration mismatch)
  if (!isMounted) {
    return null
  }

  return (
    <div className="space-y-3">
      {!isScanning ? (
        <Button
          onClick={() => setIsScanning(true)}
          className="w-full"
          variant="secondary"
        >
          Scan QR / Barcode
        </Button>
      ) : (
        <>
          <div
            id="qr-reader"
            className="w-full rounded-lg overflow-hidden min-h-[300px]"
          />
          <Button
            onClick={() => setIsScanning(false)}
            className="w-full"
            variant="destructive"
          >
            Arrêter le scan
          </Button>
        </>
      )}

      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      {scannedCode && (
        <p className="text-sm text-muted-foreground text-center">
          Scanned:{" "}
          <span className="font-mono text-foreground">{scannedCode}</span>
        </p>
      )}
    </div>
  )
}
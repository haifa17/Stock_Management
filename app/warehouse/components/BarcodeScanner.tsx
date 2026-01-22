"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Html5Qrcode } from "html5-qrcode"

export function BarcodeScanner() {
  const [scannedCode, setScannedCode] = useState("")
  const [isScanning, setIsScanning] = useState(false)
  const [error, setError] = useState("")
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    return () => {
      // Cleanup: stop scanner on unmount
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop()
      }
    }
  }, [])

  const startRealScan = async () => {
    setIsScanning(true)
    setError("")

    try {
      const scanner = new Html5Qrcode("qr-reader")
      scannerRef.current = scanner

      await scanner.start(
        { facingMode: "environment" }, // Caméra arrière
        {
          fps: 10, // Frames par seconde
          qrbox: { width: 250, height: 250 }, // Zone de scan
        },
        (decodedText) => {
          // Succès du scan
          setScannedCode(decodedText)
          scanner.stop()
          setIsScanning(false)
        },
        (errorMessage) => {
          // Erreur de scan (normal si rien n'est détecté)
          console.log(errorMessage)
        }
      )
    } catch (err) {
      console.error("Erreur de scan:", err)
      setError("Impossible d'accéder à la caméra")
      setIsScanning(false)
    }
  }

  const stopScan = () => {
    if (scannerRef.current?.isScanning) {
      scannerRef.current.stop()
      setIsScanning(false)
    }
  }

  return (
    <div className="space-y-3">
      {!isScanning ? (
        <Button
          onClick={startRealScan}
          className="w-full cursor-pointer"
          variant="secondary"
        >
          Scan QR / Barcode
        </Button>
      ) : (
        <>
          <div id="qr-reader" className="w-full rounded-lg overflow-hidden" />
          <Button
            onClick={stopScan}
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
          Scanned: <span className="font-mono text-foreground">{scannedCode}</span>
        </p>
      )}
    </div>
  )
}
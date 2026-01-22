"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { generateScanCode } from "../utils"


export function BarcodeScanner() {
  const [scannedCode, setScannedCode] = useState("")
  const [isScanning, setIsScanning] = useState(false)

  const handleScan = () => {
    setIsScanning(true)
    
    // Simulate scanning delay
    setTimeout(() => {
      setScannedCode(generateScanCode())
      setIsScanning(false)
    }, 500)
  }

  return (
    <>
      <Button
        onClick={handleScan}
        className="w-full"
        variant="secondary"
        disabled={isScanning}
      >
        {isScanning ? "Scanning..." : "Scan QR / Barcode"}
      </Button>
      {scannedCode && (
        <p className="text-sm text-muted-foreground text-center">
          Scanned: <span className="font-mono text-foreground">{scannedCode}</span>
        </p>
      )}
    </>
  )
}
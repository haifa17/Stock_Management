import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface StockByTypeProps {
  stockByType: {
    carcass: number
    primal: number
    cut: number
  }
}

const STOCK_TYPE_LABELS = {
  carcass: "Carcass",
  primal: "Primal",
  cut: "Cut",
} as const

export function StockByType({ stockByType }: StockByTypeProps) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Stock by Type</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-3 gap-4 text-center">
          {(Object.keys(stockByType) as Array<keyof typeof stockByType>).map((type) => (
            <div key={type}>
              <p className="text-lg font-semibold text-foreground">
                {stockByType[type].toFixed(1)} kg
              </p>
              <p className="text-xs text-muted-foreground">
                {STOCK_TYPE_LABELS[type]}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
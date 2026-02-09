// components/quickbooks/ReportsView.tsx
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ReportRow {
  value?: string;
  Header?: { ColData: Array<{ value: string }> };
  Summary?: { ColData: Array<{ value: string }> };
  Rows?: { Row: ReportRow[] };
  ColData?: Array<{ value: string }>;
}

interface ReportsViewProps {
  report: any;
}

export function ReportsView({ report }: ReportsViewProps) {
  if (!report || !report.Rows) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No report data available
      </div>
    );
  }

  // Extract key metrics from P&L report
  const extractMetrics = () => {
    const rows = report.Rows?.Row || [];
    const metrics: any = {};

    rows.forEach((row: ReportRow) => {
      const header = row.Header?.ColData?.[0]?.value;
      const summary = row.Summary?.ColData?.[1]?.value;

      if (header === "Total Income" && summary) {
        metrics.totalIncome = parseFloat(summary.replace(/,/g, ""));
      }
      if (header === "Total Expenses" && summary) {
        metrics.totalExpenses = parseFloat(summary.replace(/,/g, ""));
      }
      if (header === "Net Income" && summary) {
        metrics.netIncome = parseFloat(summary.replace(/,/g, ""));
      }
    });

    return metrics;
  };

  const metrics = extractMetrics();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ${metrics.totalIncome?.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Expenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ${metrics.totalExpenses?.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Income
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div
              className={`text-2xl font-bold ${
                metrics.netIncome >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              ${metrics.netIncome?.toFixed(2) || "0.00"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Full Report Data</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-sm bg-muted p-4 rounded-lg overflow-auto max-h-96">
            {JSON.stringify(report, null, 2)}
          </pre>
        </CardContent>
      </Card>
    </div>
  );
}

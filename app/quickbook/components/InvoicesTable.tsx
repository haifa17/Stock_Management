// components/quickbooks/InvoicesTable.tsx
"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Invoice {
  Id: string;
  DocNumber: string;
  TxnDate: string;
  DueDate: string;
  CustomerRef: { name: string };
  TotalAmt: number;
  Balance: number;
  EmailStatus?: string;
}

interface InvoicesTableProps {
  invoices: Invoice[];
}

export function InvoicesTable({ invoices }: InvoicesTableProps) {
  if (!invoices || invoices.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No invoices found
      </div>
    );
  }

  const getStatusBadge = (balance: number) => {
    if (balance === 0) {
      return (
        <Badge variant="default" className="bg-green-500">
          Paid
        </Badge>
      );
    } else {
      return <Badge variant="destructive">Unpaid</Badge>;
    }
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Invoice #</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Due Date</TableHead>
            <TableHead className="text-right">Amount</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {invoices.map((invoice) => (
            <TableRow key={invoice.Id}>
              <TableCell className="font-medium">{invoice.DocNumber}</TableCell>
              <TableCell>{invoice.CustomerRef?.name || "N/A"}</TableCell>
              <TableCell>
                {new Date(invoice.TxnDate).toLocaleDateString()}
              </TableCell>
              <TableCell>
                {new Date(invoice.DueDate).toLocaleDateString()}
              </TableCell>
              <TableCell className="text-right">
                ${invoice.TotalAmt?.toFixed(2)}
              </TableCell>
              <TableCell className="text-right">
                ${invoice.Balance?.toFixed(2)}
              </TableCell>
              <TableCell>{getStatusBadge(invoice.Balance)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

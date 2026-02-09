// components/quickbooks/CustomersTable.tsx
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

interface Customer {
  Id: string;
  DisplayName: string;
  CompanyName?: string;
  PrimaryEmailAddr?: { Address: string };
  PrimaryPhone?: { FreeFormNumber: string };
  Balance?: number;
  Active?: boolean;
}

interface CustomersTableProps {
  customers: Customer[];
}

export function CustomersTable({ customers }: CustomersTableProps) {
  if (!customers || customers.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No customers found
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Company</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="text-right">Balance</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {customers.map((customer) => (
            <TableRow key={customer.Id}>
              <TableCell className="font-medium">
                {customer.DisplayName}
              </TableCell>
              <TableCell>{customer.CompanyName || "—"}</TableCell>
              <TableCell>
                {customer.PrimaryEmailAddr?.Address || "—"}
              </TableCell>
              <TableCell>
                {customer.PrimaryPhone?.FreeFormNumber || "—"}
              </TableCell>
              <TableCell className="text-right">
                ${customer.Balance?.toFixed(2) ?? "0.00"}
              </TableCell>
              <TableCell>
                {customer.Active !== false ? (
                  <Badge variant="default" className="bg-green-500">
                    Active
                  </Badge>
                ) : (
                  <Badge variant="secondary">Inactive</Badge>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
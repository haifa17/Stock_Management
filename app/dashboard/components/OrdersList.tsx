"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Order } from "@/lib/types";
import { toast } from "react-toastify";
import { OrderStatus } from "@/lib/airtable/airtable-types";
import axios from "axios";

interface OrdersListProps {
  initialOrders: Order[];
}

const ORDER_STATUSES: OrderStatus[] = ["Pending", "Confirmed", "Completed"];

const ORDER_STATUS_STYLES: Record<OrderStatus, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-red-500 text-white",
};

export function OrdersList({ initialOrders }: OrdersListProps) {
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [isUpdating, setIsUpdating] = useState(false);

  const updateOrderStatus = async (order: Order, status: OrderStatus) => {
    setIsUpdating(true);

    try {
      const { data: updatedOrder } = await axios.patch(
        `/api/order/${order.id}`,
        { status },
      );

      // Update local state after DB confirms
      setOrders((prevOrders) =>
        prevOrders.map((o) =>
          o.id === order.id ? { ...o, status: updatedOrder.status } : o,
        ),
      );

      toast.success("Status updated successfully");
    } catch (error: any) {
      console.error("Error updating status:", error);
      toast.error(error.response?.data?.error || "Error updating status");
    } finally {
      setIsUpdating(false);
    }
  };
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Recent Orders</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {orders.map((order) => (
          <div key={order.id} className="border rounded-lg p-3">
            <div className="flex justify-between items-start mb-2">
              <div>
                <p className="font-semibold text-foreground">
                  {order.customer}
                </p>
                <p className="text-xs text-muted-foreground">
                  {order.id} • {order.date}
                </p>
              </div>
              <Badge className={ORDER_STATUS_STYLES[order.status]}>
                {order.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {order.items.join(", ")} • {order.totalWeight} lb
            </p>
            <div className="flex gap-2">
              {ORDER_STATUSES.map((status) => (
                <Button
                  key={status}
                  variant={order.status === status ? "default" : "outline"}
                  size="sm"
                  className="flex-1 text-xs"
                  onClick={() => updateOrderStatus(order, status)}
                  disabled={isUpdating}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

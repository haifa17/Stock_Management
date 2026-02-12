import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, Calendar } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface RecentActivityProps {
  recentInbound: any[];
  recentOutbound: any[];
}

export function RecentActivity({
  recentInbound,
  recentOutbound,
}: RecentActivityProps) {
  // Combine and sort all activities by date
  const allActivities = [
    ...recentInbound.map((item) => ({
      type: "inbound" as const,
      date: item.arrivalDate,
      lotId: item.lotId,
      product: item.product,
      weight: item.qtyReceived,
      provider: item.provider,
      grade: item.grade,
    })),
    ...recentOutbound.map((item) => ({
      type: "outbound" as const,
      date: item.saleDate,
      lotId: item.lotId,
      weight: item.weightOut,
      pieces: item.pieces,
    })),
  ].sort((a, b) => {
    const dateA = new Date(a.date || 0);
    const dateB = new Date(b.date || 0);
    return dateB.getTime() - dateA.getTime();
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const itemDate = new Date(date);
    itemDate.setHours(0, 0, 0, 0);

    const diffDays = Math.floor(
      (today.getTime() - itemDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return "Today";
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Recent Activity (Last 7 Days)
        </CardTitle>
      </CardHeader>
      <CardContent>
        {allActivities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </p>
        ) : (
          <div className="space-y-3">
            {allActivities.slice(0, 10).map((activity, index) => (
              <div
                key={`${activity.type}-${activity.lotId}-${index}`}
                className="flex items-start gap-3 p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors"
              >
                {/* Icon */}
                <div
                  className={`p-2 rounded-full ${
                    activity.type === "inbound"
                      ? "bg-green-100 dark:bg-green-950"
                      : "bg-red-100 dark:bg-red-950"
                  }`}
                >
                  {activity.type === "inbound" ? (
                    <ArrowUp className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : (
                    <ArrowDown className="h-4 w-4 text-red-600 dark:text-red-400" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge
                          variant={
                            activity.type === "inbound"
                              ? "default"
                              : "destructive"
                          }
                          className="text-xs"
                        >
                          {activity.type === "inbound" ? "IN" : "OUT"}
                        </Badge>
                        <span className="font-medium text-sm">
                          {activity.lotId}
                        </span>
                      </div>

                      {activity.type === "inbound" ? (
                        <div className="mt-1 space-y-0.5">
                          <p className="text-sm font-medium">
                            {activity.product}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {activity.provider} • {activity.grade}
                          </p>
                        </div>
                      ) : (
                        <p className="text-sm text-muted-foreground mt-1">
                          {activity.pieces} pieces
                        </p>
                      )}
                    </div>

                    <div className="text-right">
                      <p
                        className={`text-sm font-semibold ${
                          activity.type === "inbound"
                            ? "text-green-600 dark:text-green-400"
                            : "text-red-600 dark:text-red-400"
                        }`}
                      >
                        {activity.type === "inbound" ? "+" : "-"}
                        {activity.weight.toFixed(1)} £
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {formatDate(activity.date)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
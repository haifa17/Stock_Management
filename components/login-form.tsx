"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type UserRole = "staff" | "admin";

const ROLE_CONFIG = {
  staff: { label: "Warehouse Staff", route: "/warehouse" },
  admin: { label: "Admin", route: "/dashboard" },
} as const;

export default function LoginForm() {
  const router = useRouter();
  const [role, setRole] = useState<UserRole>("staff");
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    startTransition(() => {
      router.push(ROLE_CONFIG[role].route);
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          placeholder="user@company.com"
          defaultValue="demo@xprestrack.com"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          placeholder="••••••••"
          defaultValue="password"
          required
        />
      </div>

      <div className="space-y-2">
        <Label>Role</Label>
        <div className="flex gap-2">
          {(Object.keys(ROLE_CONFIG) as UserRole[]).map((roleKey) => (
            <Button
              key={roleKey}
              type="button"
              variant={role === roleKey ? "default" : "outline"}
              className="flex-1"
              onClick={() => setRole(roleKey)}
              disabled={isPending}
            >
              {ROLE_CONFIG[roleKey].label}
            </Button>
          ))}
        </div>
      </div>

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}

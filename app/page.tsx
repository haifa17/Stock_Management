import { redirect } from "next/navigation";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import LoginForm from "@/components/login-form";
import { getCurrentUser } from "@/lib/auth/get-current-user";

export default async function LoginPage() {
  const user = await getCurrentUser();

  if (user) {
    // If user is already logged in, redirect to dashboard
    redirect("/dashboard");
  }

  // Otherwise, render the login page
  return (
    <main className="min-h-screen bg-muted flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">XpresTrack</CardTitle>
          <CardDescription>Meat Inventory Management</CardDescription>
        </CardHeader>
        <CardContent>
          <LoginForm />
        </CardContent>
      </Card>
    </main>
  );
}

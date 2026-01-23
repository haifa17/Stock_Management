import { cookies } from "next/headers";
import { jwtVerify } from "jose";
import { UserRole } from "../airtable/types";

const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production",
);

export interface AuthUser {
  userId: string;
  email: string;
  role: UserRole;
}

// Récupérer l'utilisateur connecté depuis le cookie
export async function getAuthUser(): Promise<AuthUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get("auth-token");

    if (!token) {
      return null;
    }

    const { payload } = await jwtVerify(token.value, SECRET_KEY);

    return {
      userId: payload.userId as string,
      email: payload.email as string,
      role: payload.role as UserRole,
    };
  } catch (error) {
    console.error("Erreur de vérification du token:", error);
    return null;
  }
}

// Vérifier si l'utilisateur est authentifié
export async function isAuthenticated(): Promise<boolean> {
  const user = await getAuthUser();
  return user !== null;
}

// Vérifier si l'utilisateur est admin
export async function isAdmin(): Promise<boolean> {
  const user = await getAuthUser();
  return user?.role === "admin";
}

// Vérifier si l'utilisateur est warehouse staff
export async function isWarehouseStaff(): Promise<boolean> {
  const user = await getAuthUser();
  return user?.role === "warehouseStaff";
}

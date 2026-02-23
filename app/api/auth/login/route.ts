import { NextRequest, NextResponse } from "next/server";
import { usersService } from "@/lib/airtable/users-service";
import { SignJWT } from "jose";

// Clé secrète pour signer les tokens JWT
const SECRET_KEY = new TextEncoder().encode(
  process.env.JWT_SECRET || "your-secret-key-change-in-production",
);

// POST - Connexion
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // Validation des champs
    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 },
      );
    }

    // Authentifier l'utilisateur
    const user = await usersService.authenticate(email, password);

    if (!user) {
      return NextResponse.json(
        { success: false, error: "Incorrect email or password" },
        { status: 401 },
      );
    }

    // Créer un JWT token
    const token = await new SignJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
    })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("7d") // Token valide 7 jours
      .sign(SECRET_KEY);

    // Créer la réponse
    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });

    // Définir le cookie avec le token
    response.cookies.set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 jours
      path: "/",
    });

    return response;
  } catch (error) {
    console.error("Connection failed:", error);
    return NextResponse.json(
      { success: false, error: "Server error" },
      { status: 500 },
    );
  }
}

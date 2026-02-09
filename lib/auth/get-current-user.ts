// lib/auth/get-current-user.ts
import { getAuthUser } from "./utils";
import { usersService } from "../airtable/users-service";
import { User } from "../types";

export async function getCurrentUser(): Promise<User | null> {
  try {
    const authUser = await getAuthUser();
    
    if (!authUser) {
      return null;
    }

    // Get full user details from Airtable (including QB tokens)
    const user = await usersService.getById(authUser.userId);
    
    return user;
  } catch (error) {
    console.error("Error getting current user:", error);
    return null;
  }
}
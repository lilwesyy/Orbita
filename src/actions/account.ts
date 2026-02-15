"use server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";

interface AccountActionResult {
  error?: string;
  success?: boolean;
}

export async function updateProfile(
  _prevState: AccountActionResult,
  formData: FormData
): Promise<AccountActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const name = formData.get("name") as string;
  const email = formData.get("email") as string;

  if (!name?.trim()) {
    return { error: "Name is required" };
  }

  if (!email?.trim()) {
    return { error: "Email is required" };
  }

  try {
    // Check if email is already taken by another user
    const existing = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (existing && existing.id !== session.user.id) {
      return { error: "Email is already in use" };
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        name: name.trim(),
        email: email.trim(),
      },
    });

    revalidatePath("/", "layout");
    return { success: true };
  } catch {
    return { error: "Failed to update profile" };
  }
}

export async function changePassword(
  _prevState: AccountActionResult,
  formData: FormData
): Promise<AccountActionResult> {
  const session = await auth();
  if (!session?.user?.id) {
    return { error: "Not authenticated" };
  }

  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!newPassword || newPassword.length < 8) {
    return { error: "New password must be at least 8 characters" };
  }

  if (newPassword !== confirmPassword) {
    return { error: "Passwords do not match" };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { password: true },
    });

    // If user has an existing password, verify the current one
    if (user?.password) {
      if (!currentPassword) {
        return { error: "Current password is required" };
      }

      const isValid = await bcrypt.compare(currentPassword, user.password);
      if (!isValid) {
        return { error: "Current password is incorrect" };
      }
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: session.user.id },
      data: { password: hashedPassword },
    });

    revalidatePath("/account");
    return { success: true };
  } catch {
    return { error: "Failed to change password" };
  }
}

"use server";

import { prisma } from "@/lib/prisma";
import { encrypt, decrypt } from "@/lib/crypto";
import { revalidatePath } from "next/cache";

interface CredentialActionResult {
  error?: string;
  success?: boolean;
}

export async function createCredential(
  projectId: string,
  _prevState: CredentialActionResult,
  formData: FormData
): Promise<CredentialActionResult> {
  const label = formData.get("label") as string;
  const category = (formData.get("category") as string) || "other";
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const url = formData.get("url") as string;
  const notes = formData.get("notes") as string;

  if (!label || label.trim() === "") {
    return { error: "Label is required" };
  }

  try {
    await prisma.credential.create({
      data: {
        label: label.trim(),
        category,
        username: username?.trim() || null,
        password: password ? encrypt(password) : null,
        url: url?.trim() || null,
        notes: notes?.trim() || null,
        projectId,
      },
    });
  } catch {
    return { error: "Error creating credential" };
  }

  revalidatePath(`/projects/${projectId}/credentials`);
  return { success: true };
}

export async function updateCredential(
  credentialId: string,
  projectId: string,
  _prevState: CredentialActionResult,
  formData: FormData
): Promise<CredentialActionResult> {
  const label = formData.get("label") as string;
  const category = (formData.get("category") as string) || "other";
  const username = formData.get("username") as string;
  const password = formData.get("password") as string;
  const keepPassword = formData.get("keepPassword") as string;
  const url = formData.get("url") as string;
  const notes = formData.get("notes") as string;

  if (!label || label.trim() === "") {
    return { error: "Label is required" };
  }

  try {
    const data: Record<string, string | null> = {
      label: label.trim(),
      category,
      username: username?.trim() || null,
      url: url?.trim() || null,
      notes: notes?.trim() || null,
    };

    // Only update password if a new one was provided
    if (keepPassword !== "true") {
      data.password = password ? encrypt(password) : null;
    }

    await prisma.credential.update({
      where: { id: credentialId },
      data,
    });
  } catch {
    return { error: "Error updating credential" };
  }

  revalidatePath(`/projects/${projectId}/credentials`);
  return { success: true };
}

export async function deleteCredential(
  credentialId: string,
  projectId: string
): Promise<CredentialActionResult> {
  try {
    await prisma.credential.delete({
      where: { id: credentialId },
    });
  } catch {
    return { error: "Error deleting credential" };
  }

  revalidatePath(`/projects/${projectId}/credentials`);
  return { success: true };
}

interface DecryptedPasswordResult {
  error?: string;
  password?: string;
}

export async function getDecryptedPassword(
  credentialId: string
): Promise<DecryptedPasswordResult> {
  try {
    const credential = await prisma.credential.findUnique({
      where: { id: credentialId },
      select: { password: true },
    });

    if (!credential?.password) {
      return { error: "No password found" };
    }

    return { password: decrypt(credential.password) };
  } catch {
    return { error: "Error decrypting password" };
  }
}

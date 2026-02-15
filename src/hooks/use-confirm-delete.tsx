"use client";

import { useState, useCallback } from "react";
import ConfirmModal from "@/components/confirm-modal";

interface UseConfirmDeleteOptions {
  title?: string;
  message?: string | ((item: string) => string);
  confirmLabel?: string;
}

export function useConfirmDelete(
  onDelete: (id: string) => Promise<void>,
  options: UseConfirmDeleteOptions = {}
) {
  const {
    title = "Confirm Delete",
    message = "Are you sure? This action cannot be undone.",
    confirmLabel = "Delete",
  } = options;

  const [pendingId, setPendingId] = useState<string | null>(null);
  const [pendingLabel, setPendingLabel] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const requestDelete = useCallback((id: string, label = "") => {
    setPendingId(id);
    setPendingLabel(label);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!pendingId) return;
    setIsLoading(true);
    await onDelete(pendingId);
    setIsLoading(false);
    setPendingId(null);
  }, [pendingId, onDelete]);

  const handleClose = useCallback(() => {
    if (!isLoading) {
      setPendingId(null);
    }
  }, [isLoading]);

  const resolvedMessage = typeof message === "function"
    ? message(pendingLabel)
    : message;

  const confirmDialog = (
    <ConfirmModal
      isOpen={pendingId !== null}
      onClose={handleClose}
      onConfirm={handleConfirm}
      title={title}
      message={resolvedMessage}
      confirmLabel={confirmLabel}
      isLoading={isLoading}
    />
  );

  return { requestDelete, confirmDialog };
}

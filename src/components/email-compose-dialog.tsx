"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { sendOwnerEmail } from "@/actions/owner-email";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

interface EmailComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultTo?: string;
  defaultSubject?: string;
  defaultBody?: string;
}

export function EmailComposeDialog({
  open,
  onOpenChange,
  defaultTo,
  defaultSubject,
  defaultBody,
}: EmailComposeDialogProps) {
  const [state, formAction, isPending] = useActionState(sendOwnerEmail, {});
  const formRef = useRef<HTMLFormElement>(null);
  const prevStateRef = useRef(state);

  useEffect(() => {
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;
    if (state.error) {
      toast.error(state.error);
    } else if (state.success && state.message) {
      toast.success(state.message);
      formRef.current?.reset();
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Compose Email</DialogTitle>
        </DialogHeader>
        <form ref={formRef} action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="compose-to">To</Label>
            <Input
              id="compose-to"
              name="to"
              type="email"
              placeholder="recipient@example.com"
              defaultValue={defaultTo}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="compose-subject">Subject</Label>
            <Input
              id="compose-subject"
              name="subject"
              placeholder="Email subject"
              defaultValue={defaultSubject}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="compose-body">Message</Label>
            <Textarea
              id="compose-body"
              name="body"
              placeholder="Write your message..."
              rows={8}
              defaultValue={defaultBody}
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Sending..." : "Send"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

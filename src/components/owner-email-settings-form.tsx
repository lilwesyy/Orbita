"use client";

import { useState, useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { saveOwnerEmailConfig, deleteOwnerEmailConfig, testOwnerEmailConnection } from "@/actions/owner-email";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconMail, IconTrash, IconEye, IconEyeOff } from "@tabler/icons-react";
import { Zap } from "lucide-react";
import ConfirmModal from "@/components/confirm-modal";

interface OwnerEmailSettingsFormProps {
  hasResendApiKey: boolean;
}

export function OwnerEmailSettingsForm({ hasResendApiKey }: OwnerEmailSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(saveOwnerEmailConfig, {});
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isTesting, startTestTransition] = useTransition();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const prevStateRef = useRef(state);

  useEffect(() => {
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;
    if (state.error) {
      toast.error(state.error);
    } else if (state.success && state.message) {
      toast.success(state.message);
    }
  }, [state]);

  async function handleDelete() {
    setConfirmDeleteOpen(false);
    startDeleteTransition(async () => {
      const result = await deleteOwnerEmailConfig();
      if (result.success) {
        toast.success("Email configuration removed.");
      } else if (result.error) {
        toast.error(result.error);
      }
    });
  }

  function handleTest() {
    startTestTransition(async () => {
      const result = await testOwnerEmailConnection();
      if (result.success && result.message) {
        toast.success(result.message);
      } else if (result.error) {
        toast.error(result.error);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <IconMail className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle>Email (Resend)</CardTitle>
              {hasResendApiKey && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Configured
                </Badge>
              )}
            </div>
            <CardDescription>
              Required for the Email inbox. Get your API key from{" "}
              <a
                href="https://resend.com/api-keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-primary"
              >
                resend.com
              </a>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="ownerApiKey">
              {hasResendApiKey ? "Replace API Key" : "API Key"}
            </Label>
            <div className="relative">
              <Input
                id="ownerApiKey"
                name="apiKey"
                type={showApiKey ? "text" : "password"}
                placeholder="re_..."
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowApiKey(!showApiKey)}
                tabIndex={-1}
              >
                {showApiKey ? (
                  <IconEyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <IconEye className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : hasResendApiKey ? "Update Key" : "Save Key"}
            </Button>
            {hasResendApiKey && (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTest}
                  disabled={isTesting}
                >
                  <Zap className="w-4 h-4 mr-1" />
                  {isTesting ? "Testing..." : "Test Connection"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setConfirmDeleteOpen(true)}
                  disabled={isDeleting}
                  className="text-destructive"
                >
                  <IconTrash className="w-4 h-4 mr-1" />
                  {isDeleting ? "Removing..." : "Remove Key"}
                </Button>
              </>
            )}
          </div>
        </form>
        <ConfirmModal
          isOpen={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Remove Email Configuration"
          message="Are you sure you want to remove the Resend API key? The email inbox will stop working."
          isLoading={isDeleting}
        />
      </CardContent>
    </Card>
  );
}

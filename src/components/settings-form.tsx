"use client";

import { useState, useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { saveAnthropicApiKey, deleteAnthropicApiKey } from "@/actions/settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconKey, IconTrash, IconEye, IconEyeOff } from "@tabler/icons-react";
import ConfirmModal from "@/components/confirm-modal";

interface SettingsFormProps {
  hasApiKey: boolean;
}

export function SettingsForm({ hasApiKey }: SettingsFormProps) {
  const [state, formAction, isPending] = useActionState(saveAnthropicApiKey, {});
  const [isDeleting, startDeleteTransition] = useTransition();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const prevStateRef = useRef(state);

  useEffect(() => {
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;
    if (state.error) {
      toast.error(state.error);
    } else if (state.success) {
      toast.success("API key saved successfully.");
    }
  }, [state]);

  async function handleDelete() {
    setConfirmDeleteOpen(false);
    startDeleteTransition(async () => {
      const result = await deleteAnthropicApiKey();
      if (result.success) {
        toast.success("API key removed.");
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
            <IconKey className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle>Anthropic API Key</CardTitle>
              {hasApiKey && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Configured
                </Badge>
              )}
            </div>
            <CardDescription>
              Required for AI-powered features like Ad Maker. Get your key from{" "}
              <a
                href="https://console.anthropic.com/settings/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-primary"
              >
                console.anthropic.com
              </a>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="apiKey">
              {hasApiKey ? "Replace API Key" : "API Key"}
            </Label>
            <div className="relative">
              <Input
                id="apiKey"
                name="apiKey"
                type={showApiKey ? "text" : "password"}
                placeholder="sk-ant-..."
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
              {isPending ? "Saving..." : hasApiKey ? "Update Key" : "Save Key"}
            </Button>
            {hasApiKey && (
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
            )}
          </div>
        </form>
        <ConfirmModal
          isOpen={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Remove API Key"
          message="Are you sure you want to remove the Anthropic API key? AI-powered features will stop working."
          isLoading={isDeleting}
        />
      </CardContent>
    </Card>
  );
}

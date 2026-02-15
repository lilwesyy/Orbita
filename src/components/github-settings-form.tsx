"use client";

import { useState, useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import { saveGitHubCredentials, deleteGitHubCredentials } from "@/actions/settings";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconBrandGithub, IconTrash, IconEye, IconEyeOff } from "@tabler/icons-react";
import ConfirmModal from "@/components/confirm-modal";

interface GitHubSettingsFormProps {
  hasCredentials: boolean;
}

export function GitHubSettingsForm({ hasCredentials }: GitHubSettingsFormProps) {
  const [state, formAction, isPending] = useActionState(saveGitHubCredentials, {});
  const [isDeleting, startDeleteTransition] = useTransition();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const prevStateRef = useRef(state);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  useEffect(() => {
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;
    if (state.error) {
      toast.error(state.error);
    } else if (state.success) {
      toast.success("GitHub credentials saved successfully.");
    }
  }, [state]);

  async function handleDelete() {
    setConfirmDeleteOpen(false);
    startDeleteTransition(async () => {
      const result = await deleteGitHubCredentials();
      if (result.success) {
        toast.success("GitHub credentials removed.");
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
            <IconBrandGithub className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle>GitHub OAuth App</CardTitle>
              {hasCredentials && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Configured
                </Badge>
              )}
            </div>
            <CardDescription>
              Required for GitHub integration. Create an OAuth App at{" "}
              <a
                href="https://github.com/settings/developers"
                target="_blank"
                rel="noopener noreferrer"
                className="underline text-primary"
              >
                GitHub Developer Settings
              </a>
              . Set the callback URL to{" "}
              <code className="text-xs bg-muted px-1 py-0.5 rounded">
                {origin}/api/github/callback
              </code>
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="githubClientId">
              {hasCredentials ? "Replace Client ID" : "Client ID"}
            </Label>
            <Input
              id="githubClientId"
              name="githubClientId"
              type="text"
              placeholder="Ov23li..."
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="githubClientSecret">
              {hasCredentials ? "Replace Client Secret" : "Client Secret"}
            </Label>
            <div className="relative">
              <Input
                id="githubClientSecret"
                name="githubClientSecret"
                type={showSecret ? "text" : "password"}
                placeholder="Client secret..."
                required
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowSecret(!showSecret)}
                tabIndex={-1}
              >
                {showSecret ? (
                  <IconEyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <IconEye className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : hasCredentials ? "Update Credentials" : "Save Credentials"}
            </Button>
            {hasCredentials && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={isDeleting}
                className="text-destructive"
              >
                <IconTrash className="w-4 h-4 mr-1" />
                {isDeleting ? "Removing..." : "Remove"}
              </Button>
            )}
          </div>
        </form>
        <ConfirmModal
          isOpen={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Remove GitHub Credentials"
          message="Are you sure you want to remove the GitHub OAuth credentials? GitHub integration will stop working."
          isLoading={isDeleting}
        />
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useActionState, useEffect, useRef, useTransition } from "react";
import { toast } from "sonner";
import {
  saveOwnerEmailConfig,
  deleteOwnerEmailConfig,
  testOwnerEmailConnection,
} from "@/actions/owner-email";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { IconMail, IconTrash, IconEye, IconEyeOff, IconBrandGmail, IconCloud } from "@tabler/icons-react";
import { Zap } from "lucide-react";
import ConfirmModal from "@/components/confirm-modal";

interface OwnerEmailSettingsFormProps {
  currentProvider: string | null;
  hasConfig: boolean;
}

type ProviderOption = "RESEND" | "GMAIL" | "ICLOUD";

const providers: { value: ProviderOption; label: string; icon: React.ReactNode }[] = [
  { value: "RESEND", label: "Resend", icon: <IconMail className="w-4 h-4" /> },
  { value: "GMAIL", label: "Gmail", icon: <IconBrandGmail className="w-4 h-4" /> },
  { value: "ICLOUD", label: "iCloud", icon: <IconCloud className="w-4 h-4" /> },
];

const providerInfo: Record<Exclude<ProviderOption, "RESEND">, { appPasswordUrl: string; instructions: string }> = {
  GMAIL: {
    appPasswordUrl: "https://myaccount.google.com/apppasswords",
    instructions: "Enable 2-Step Verification, then generate an App Password.",
  },
  ICLOUD: {
    appPasswordUrl: "https://appleid.apple.com/account/manage",
    instructions: "Go to Apple ID > Sign-In and Security > App-Specific Passwords.",
  },
};

export function OwnerEmailSettingsForm({ currentProvider, hasConfig }: OwnerEmailSettingsFormProps) {
  const [selectedProvider, setSelectedProvider] = useState<ProviderOption>(
    (currentProvider as ProviderOption) || "RESEND"
  );
  const [state, formAction, isPending] = useActionState(saveOwnerEmailConfig, {});
  const [isDeleting, startDeleteTransition] = useTransition();
  const [isTesting, startTestTransition] = useTransition();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
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

  const providerLabel = providers.find((p) => p.value === currentProvider)?.label ?? "Email";
  const isImap = selectedProvider === "GMAIL" || selectedProvider === "ICLOUD";

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10">
            <IconMail className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <CardTitle>Email ({hasConfig ? providerLabel : "Not configured"})</CardTitle>
              {hasConfig && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  Configured
                </Badge>
              )}
            </div>
            <CardDescription>
              Configure your email provider for the inbox and sending.
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="provider" value={selectedProvider} />

          {/* Provider selector */}
          <div className="space-y-2">
            <Label>Provider</Label>
            <div className="flex gap-2">
              {providers.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    setSelectedProvider(p.value);
                    setShowSecret(false);
                  }}
                  className={`flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-medium transition-colors ${
                    selectedProvider === p.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-background text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {p.icon}
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resend form */}
          {selectedProvider === "RESEND" && (
            <div className="space-y-2">
              <Label htmlFor="ownerApiKey">
                {hasConfig && currentProvider === "RESEND" ? "Replace API Key" : "API Key"}
              </Label>
              <p className="text-xs text-muted-foreground">
                Get your API key from{" "}
                <a
                  href="https://resend.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline text-primary"
                >
                  resend.com
                </a>
              </p>
              <div className="relative">
                <Input
                  id="ownerApiKey"
                  name="apiKey"
                  type={showSecret ? "text" : "password"}
                  placeholder="re_..."
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
          )}

          {/* Gmail / iCloud form */}
          {isImap && (
            <>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-300">
                <p>{providerInfo[selectedProvider].instructions}</p>
                <a
                  href={providerInfo[selectedProvider].appPasswordUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 inline-block underline font-medium"
                >
                  Generate App Password
                </a>
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerEmail">Email Address</Label>
                <Input
                  id="ownerEmail"
                  name="email"
                  type="email"
                  placeholder={
                    selectedProvider === "GMAIL"
                      ? "you@gmail.com"
                      : "you@icloud.com"
                  }
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="ownerPassword">App Password</Label>
                <div className="relative">
                  <Input
                    id="ownerPassword"
                    name="password"
                    type={showSecret ? "text" : "password"}
                    placeholder="xxxx xxxx xxxx xxxx"
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
            </>
          )}

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : hasConfig ? "Update" : "Save"}
            </Button>
            {hasConfig && (
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
                  {isDeleting ? "Removing..." : "Remove"}
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
          message="Are you sure you want to remove the email configuration? The email inbox will stop working."
          isLoading={isDeleting}
        />
      </CardContent>
    </Card>
  );
}

"use client";

import { useActionState, useCallback, useState, useTransition, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Save, Trash2, Zap, Eye, EyeOff, Mail } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { saveEmailConfig, deleteEmailConfig, testEmailConnection } from "@/actions/email-config";
import ConfirmModal from "@/components/confirm-modal";

import Image from "next/image";

interface ProviderOption {
  id: string;
  name: string;
  logo: string;
  available: boolean;
}

const providers: ProviderOption[] = [
  { id: "resend", name: "Resend", logo: "https://cdn.resend.com/brand/resend-icon-white.png", available: true },
  { id: "sendgrid", name: "SendGrid", logo: "https://www.svgrepo.com/show/354327/sendgrid-icon.svg", available: false },
  { id: "mailgun", name: "Mailgun", logo: "https://assets.streamlinehq.com/image/private/w_300,h_300,ar_1/f_auto/v1/icons/vector-icons/brand-mailgun-h4evk1kjsbdq5o2s6nqhg.png/brand-mailgun-co3rmd7lgouo34pxy0f3.png?_a=DATAiZAAZAA0", available: false },
];

interface EmailConfigData {
  id: string;
  projectId: string;
  provider: string;
  apiKey: string;
}

interface EmailConfigFormState {
  error?: string;
  success?: boolean;
  message?: string;
}

interface EmailConfigFormProps {
  projectId: string;
  config: EmailConfigData | null;
  compact?: boolean;
}

export function EmailConfigForm({ projectId, config, compact }: EmailConfigFormProps) {
  const boundSaveAction = saveEmailConfig.bind(null, projectId);
  const [state, formAction, isPending] = useActionState(boundSaveAction, {});
  const [selectedProvider, setSelectedProvider] = useState(config?.provider ?? "resend");
  const [showApiKey, setShowApiKey] = useState(false);
  const [isTestPending, startTestTransition] = useTransition();
  const [isDeletePending, startDeleteTransition] = useTransition();
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);

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

  const handleTest = () => {
    startTestTransition(async () => {
      const result = await testEmailConnection(projectId);
      if (result.success && result.message) {
        toast.success(result.message);
      } else if (result.error) {
        toast.error(result.error);
      }
    });
  };

  const handleDelete = useCallback(() => {
    startDeleteTransition(async () => {
      const result = await deleteEmailConfig(projectId);
      if (result.success) {
        toast.success("Email configuration deleted");
      } else if (result.error) {
        toast.error(result.error);
      }
      setConfirmDeleteOpen(false);
    });
  }, [projectId]);

  const maskedApiKey = config?.apiKey
    ? config.apiKey.slice(0, 8) + "..." + config.apiKey.slice(-4)
    : "";

  if (compact && config) {
    return (
      <div className="space-y-3">
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Mail className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Provider: Resend
                </p>
                <p className="text-xs text-muted-foreground">
                  Key: {maskedApiKey}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success">Configured</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={isTestPending}
                loading={isTestPending}
              >
                <Zap /> Test
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={isDeletePending}
                loading={isDeletePending}
              >
                <Trash2 /> Delete
              </Button>
            </div>
          </CardContent>
        </Card>
        <ConfirmModal
          isOpen={confirmDeleteOpen}
          onClose={() => setConfirmDeleteOpen(false)}
          onConfirm={handleDelete}
          title="Delete Email Configuration"
          message="Are you sure you want to delete the email configuration? Email sending will stop working."
          isLoading={isDeletePending}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {config && (
        <Card>
          <CardContent className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Mail className="size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">
                  Provider: Resend
                </p>
                <p className="text-xs text-muted-foreground">
                  Key: {maskedApiKey}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="success">Configured</Badge>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTest}
                disabled={isTestPending}
                loading={isTestPending}
              >
                <Zap /> Test
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => setConfirmDeleteOpen(true)}
                disabled={isDeletePending}
                loading={isDeletePending}
              >
                <Trash2 /> Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <form action={formAction} className="space-y-6">
        <div className="space-y-3">
          <Label>Provider</Label>
          <input type="hidden" name="provider" value={selectedProvider} />
          <div className="flex gap-3">
            {providers.map((provider) => (
              <Button
                key={provider.id}
                type="button"
                variant={selectedProvider === provider.id ? "default" : "outline"}
                disabled={!provider.available || isPending}
                onClick={() => setSelectedProvider(provider.id)}
                className={cn(
                  "gap-2",
                  !provider.available && "opacity-40"
                )}
              >
                <Image src={provider.logo} alt={provider.name} width={18} height={18} className="size-[18px]" />
                {provider.name}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="apiKey">API Key *</Label>
          <Input
            id="apiKey"
            name="apiKey"
            type={showApiKey ? "text" : "password"}
            required
            placeholder="re_..."
            defaultValue={config?.apiKey ?? ""}
            disabled={isPending}
            iconRight={
              <button type="button" onClick={() => setShowApiKey(!showApiKey)} tabIndex={-1}>
                {showApiKey ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            }
          />
        </div>

        <div className="flex justify-end">
          <Button
            type="submit"
            loading={isPending}
            disabled={isPending}
          >
            <Save /> {config ? "Update Configuration" : "Save Configuration"}
          </Button>
        </div>
      </form>
      <ConfirmModal
        isOpen={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={handleDelete}
        title="Delete Email Configuration"
        message="Are you sure you want to delete the email configuration? Email sending will stop working."
        isLoading={isDeletePending}
      />
    </div>
  );
}

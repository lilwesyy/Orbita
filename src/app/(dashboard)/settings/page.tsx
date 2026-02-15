import { getSettings } from "@/actions/settings";
import { SettingsForm } from "@/components/settings-form";
import { GitHubSettingsForm } from "@/components/github-settings-form";
import { OwnerEmailSettingsForm } from "@/components/owner-email-settings-form";
import { Separator } from "@/components/ui/separator";
import { IconKey, IconMail, IconBrandGithub } from "@tabler/icons-react";

export default async function SettingsPage() {
  const { hasApiKey, hasGithubCredentials, hasEmailConfig, emailProvider } =
    await getSettings();

  const emailLabel = hasEmailConfig
    ? emailProvider === "RESEND"
      ? "Resend Email"
      : emailProvider === "GMAIL"
        ? "Gmail"
        : emailProvider === "ICLOUD"
          ? "iCloud Mail"
          : "Email"
    : "Email";

  return (
    <div className="flex flex-col gap-4 px-4 py-4 lg:px-6 md:gap-6 md:py-6">
      <div>
        <h1 className="text-2xl font-semibold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure global application settings
        </p>
      </div>

      {/* Status Overview */}
      <div className="flex flex-wrap gap-3">
        <StatusIndicator
          icon={<IconKey className="w-4 h-4" />}
          label="Anthropic API"
          configured={hasApiKey}
        />
        <StatusIndicator
          icon={<IconMail className="w-4 h-4" />}
          label={emailLabel}
          configured={hasEmailConfig}
        />
        <StatusIndicator
          icon={<IconBrandGithub className="w-4 h-4" />}
          label="GitHub OAuth"
          configured={hasGithubCredentials}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* API & Services */}
        <section>
          <h2 className="text-lg font-medium text-foreground">API & Services</h2>
          <Separator className="mt-2 mb-4" />
          <div className="space-y-6">
            <SettingsForm hasApiKey={hasApiKey} />
            <OwnerEmailSettingsForm
              currentProvider={emailProvider}
              hasConfig={hasEmailConfig}
            />
          </div>
        </section>

        {/* Integrations */}
        <section>
          <h2 className="text-lg font-medium text-foreground">Integrations</h2>
          <Separator className="mt-2 mb-4" />
          <div className="space-y-6">
            <GitHubSettingsForm hasCredentials={hasGithubCredentials} />
          </div>
        </section>
      </div>
    </div>
  );
}

function StatusIndicator({
  icon,
  label,
  configured,
}: {
  icon: React.ReactNode;
  label: string;
  configured: boolean;
}) {
  return (
    <div
      className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
        configured
          ? "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400"
          : "border-muted bg-muted/50 text-muted-foreground"
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
      <span
        className={`h-2 w-2 rounded-full ${
          configured ? "bg-green-500" : "bg-muted-foreground/40"
        }`}
      />
    </div>
  );
}

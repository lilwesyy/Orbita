import Link from "next/link";
import { IconBrandGithub } from "@tabler/icons-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GitHubConnectCardSetupProps {
  mode: "setup";
  settingsUrl: string;
  authUrl?: never;
}

interface GitHubConnectCardConnectProps {
  mode: "connect";
  authUrl: string;
  settingsUrl?: never;
  error?: string;
}

type GitHubConnectCardProps =
  | GitHubConnectCardSetupProps
  | GitHubConnectCardConnectProps;

export function GitHubConnectCard(props: GitHubConnectCardProps) {
  return (
    <Card className="w-full max-w-lg">
      <CardHeader className="items-center justify-items-center text-center">
        <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <IconBrandGithub className="h-7 w-7 text-foreground" />
        </div>
        <CardTitle>
          {props.mode === "setup" ? "GitHub Not Configured" : "Connect GitHub"}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center text-center">
        {props.mode === "setup" ? (
          <>
            <p className="text-sm text-muted-foreground max-w-sm">
              A GitHub OAuth App must be configured in Settings before you can
              connect repositories.
            </p>
            <Link
              href={props.settingsUrl}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Go to Settings
            </Link>
          </>
        ) : (
          <>
            {props.error && (
              <p className="mb-3 text-sm text-destructive">{props.error}</p>
            )}
            <p className="text-sm text-muted-foreground max-w-sm">
              Link a GitHub repository to view commits, issues, pull requests,
              branches, and contributors directly from your project dashboard.
            </p>
            <a
              href={props.authUrl}
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              <IconBrandGithub className="h-4 w-4" />
              Connect with GitHub
            </a>
          </>
        )}
      </CardContent>
    </Card>
  );
}

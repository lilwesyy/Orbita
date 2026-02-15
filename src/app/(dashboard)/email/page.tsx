import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { hasOwnerEmailConfig } from "@/actions/owner-email";
import { OwnerEmailInbox } from "@/components/owner-email-inbox";
import { IconMail } from "@tabler/icons-react";

export default async function EmailPage() {
  const configured = await hasOwnerEmailConfig();

  if (!configured) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-4 lg:px-6">
        <Card className="w-full max-w-lg">
          <CardHeader className="items-center justify-items-center text-center">
            <div className="mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
              <IconMail className="h-7 w-7 text-foreground" />
            </div>
            <CardTitle>Email Not Configured</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col items-center text-center">
            <p className="text-sm text-muted-foreground max-w-sm">
              To use the email inbox, configure your Resend API key in Settings.
            </p>
            <Link
              href="/settings"
              className="mt-5 inline-flex items-center gap-2 rounded-lg bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-opacity hover:opacity-90"
            >
              Go to Settings
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden px-4 py-4 lg:px-6">
      <div className="shrink-0">
        <h1 className="text-2xl font-semibold text-foreground">Email</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your email inbox
        </p>
      </div>
      <OwnerEmailInbox />
    </div>
  );
}

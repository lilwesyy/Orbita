import Link from "next/link";
import { hasOwnerEmailConfig } from "@/actions/owner-email";
import { OwnerEmailInbox } from "@/components/owner-email-inbox";
import { IconMail } from "@tabler/icons-react";
import { Button } from "@/components/ui/button";
import {
  Empty,
  EmptyContent,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";

export default async function EmailPage() {
  const configured = await hasOwnerEmailConfig();

  if (!configured) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-4 lg:px-6">
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant="icon">
              <IconMail />
            </EmptyMedia>
            <EmptyTitle>Email Not Configured</EmptyTitle>
            <EmptyDescription>
              To use the email inbox, configure your email provider in Settings
              (Resend, Gmail, or iCloud).
            </EmptyDescription>
          </EmptyHeader>
          <EmptyContent>
            <Button asChild>
              <Link href="/settings">Go to Settings</Link>
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col overflow-hidden px-4 py-4 lg:px-6">
      <OwnerEmailInbox />
    </div>
  );
}

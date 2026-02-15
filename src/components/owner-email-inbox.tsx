"use client";

import { EmailInbox } from "@/components/email-inbox";
import { fetchOwnerEmails, fetchOwnerEmailDetail } from "@/actions/owner-email";

export function OwnerEmailInbox() {
  return (
    <EmailInbox
      onFetchEmails={fetchOwnerEmails}
      onFetchEmailDetail={fetchOwnerEmailDetail}
      showCompose
    />
  );
}

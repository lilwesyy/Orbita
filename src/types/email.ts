export interface ResendSentEmail {
  id: string;
  to: string[];
  from: string;
  subject: string;
  created_at: string;
  last_event: string;
}

export interface ResendReceivedEmail {
  id: string;
  from: string;
  to: string[];
  subject: string;
  created_at: string;
}

export interface FetchEmailsResult {
  sent: ResendSentEmail[];
  received: ResendReceivedEmail[];
  error?: string;
}

export interface EmailThreadItem {
  id: string;
  from: string;
  to: string[];
  subject: string;
  created_at: string;
  direction: "sent" | "received";
  last_event?: string;
}

export interface EmailThread {
  subject: string;
  lastDate: string;
  emails: EmailThreadItem[];
  latestEvent?: string;
  participants: string[];
}

export interface EmailDetail {
  html: string | null;
  text: string | null;
  error?: string;
}

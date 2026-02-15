"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";
import {
  RefreshCw,
  Mail,
  Send,
  Inbox,
  Search,
  ArrowUp,
  ArrowDown,
  Loader2,
} from "lucide-react";
import { formatDateTime, cn } from "@/lib/utils";
import { fetchEmails, fetchEmailDetail } from "@/actions/email-config";
import type {
  ResendSentEmail,
  ResendReceivedEmail,
  FetchEmailsResult,
  EmailThread,
  EmailThreadItem,
  EmailDetail,
} from "@/types/email";

type BadgeVariant =
  | "default"
  | "secondary"
  | "success"
  | "warning"
  | "destructive"
  | "outline";
type FilterType = "all" | "sent" | "received";

const eventConfig: Record<string, { label: string; variant: BadgeVariant }> = {
  sent: { label: "Sent", variant: "default" },
  delivered: { label: "Delivered", variant: "success" },
  bounced: { label: "Bounced", variant: "destructive" },
  opened: { label: "Opened", variant: "success" },
  clicked: { label: "Clicked", variant: "success" },
  failed: { label: "Failed", variant: "destructive" },
  complained: { label: "Complained", variant: "warning" },
};

function formatRelativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMinutes < 1) return "just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 30) return `${diffDays}d ago`;
  return new Intl.DateTimeFormat("it-IT", {
    day: "2-digit",
    month: "short",
  }).format(date);
}

function groupBySubject(
  sent: ResendSentEmail[],
  received: ResendReceivedEmail[],
  filter: FilterType
): EmailThread[] {
  const threadMap = new Map<string, EmailThreadItem[]>();

  if (filter !== "received") {
    for (const email of sent) {
      const key = email.subject?.trim().toLowerCase() || "(no subject)";
      const items = threadMap.get(key) ?? [];
      items.push({
        id: email.id,
        from: email.from,
        to: email.to,
        subject: email.subject,
        created_at: email.created_at,
        direction: "sent",
        last_event: email.last_event,
      });
      threadMap.set(key, items);
    }
  }

  if (filter !== "sent") {
    for (const email of received) {
      const key = email.subject?.trim().toLowerCase() || "(no subject)";
      const items = threadMap.get(key) ?? [];
      items.push({
        id: email.id,
        from: email.from,
        to: email.to,
        subject: email.subject,
        created_at: email.created_at,
        direction: "received",
      });
      threadMap.set(key, items);
    }
  }

  const threads: EmailThread[] = [];

  for (const [, emails] of threadMap) {
    emails.sort(
      (a, b) =>
        new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    const lastEmail = emails[emails.length - 1];
    const lastSentEmail = [...emails]
      .reverse()
      .find((e) => e.direction === "sent");

    const participantSet = new Set<string>();
    for (const e of emails) {
      participantSet.add(e.from);
      for (const addr of e.to) {
        participantSet.add(addr);
      }
    }

    threads.push({
      subject: lastEmail.subject || "(no subject)",
      lastDate: lastEmail.created_at,
      emails,
      latestEvent: lastSentEmail?.last_event,
      participants: Array.from(participantSet),
    });
  }

  threads.sort(
    (a, b) => new Date(b.lastDate).getTime() - new Date(a.lastDate).getTime()
  );

  return threads;
}

function StatusBadge({ event }: { event: string }) {
  const cfg = eventConfig[event] ?? {
    label: event,
    variant: "outline" as BadgeVariant,
  };
  return (
    <Badge variant={cfg.variant} className="text-[10px] px-1.5 py-0">
      {cfg.label}
    </Badge>
  );
}

type FetchEmailsFn = () => Promise<FetchEmailsResult>;
type FetchEmailDetailFn = (emailId: string) => Promise<EmailDetail>;

interface EmailInboxProps {
  projectId?: string;
  onFetchEmails?: FetchEmailsFn;
  onFetchEmailDetail?: FetchEmailDetailFn;
}

export function EmailInbox({ projectId, onFetchEmails, onFetchEmailDetail }: EmailInboxProps) {
  const [sent, setSent] = useState<ResendSentEmail[]>([]);
  const [received, setReceived] = useState<ResendReceivedEmail[]>([]);
  const [isLoading, startTransition] = useTransition();
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadEmails = () => {
    startTransition(async () => {
      const result = onFetchEmails
        ? await onFetchEmails()
        : await fetchEmails(projectId!);
      setSent(result.sent);
      setReceived(result.received);
      if (result.error) toast.error(result.error);
    });
  };

  useEffect(() => {
    loadEmails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const threads = useMemo(
    () => groupBySubject(sent, received, filter),
    [sent, received, filter]
  );

  const filteredThreads = useMemo(() => {
    if (!search.trim()) return threads;
    const lower = search.toLowerCase();
    return threads.filter(
      (t) =>
        t.subject.toLowerCase().includes(lower) ||
        t.participants.some((p) => p.toLowerCase().includes(lower))
    );
  }, [threads, search]);

  const selectedThread = useMemo(
    () => filteredThreads.find((t) => t.subject === selectedSubject) ?? null,
    [filteredThreads, selectedSubject]
  );

  return (
    <TooltipProvider delayDuration={0}>
      <ResizablePanelGroup
        orientation="horizontal"
        className="h-full min-h-0 rounded-lg border"
      >
        {/* Mail List Panel */}
        <ResizablePanel defaultSize="35%" minSize="25%" maxSize="50%">
          <Tabs
            defaultValue="all"
            className="flex h-full flex-col overflow-hidden"
            onValueChange={(v) => {
              setFilter(v as FilterType);
              setSelectedSubject(null);
            }}
          >
            <div className="flex items-center px-4 py-2">
              <h2 className="text-xl font-bold">Inbox</h2>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="ml-auto h-8 w-8"
                    onClick={loadEmails}
                    disabled={isLoading}
                  >
                    <RefreshCw
                      className={cn(
                        "h-4 w-4",
                        isLoading && "animate-spin"
                      )}
                    />
                    <span className="sr-only">Refresh</span>
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Refresh emails</TooltipContent>
              </Tooltip>
            </div>
            <Separator />
            <div className="bg-background/95 p-4 backdrop-blur-sm supports-[backdrop-filter]:bg-background/60">
              <Input
                placeholder="Search..."
                icon={<Search className="h-4 w-4" />}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <TabsList className="w-full rounded-none border-b bg-transparent p-0">
              <TabsTrigger
                value="all"
                className="relative rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <Inbox className="mr-2 h-4 w-4" />
                All
              </TabsTrigger>
              <TabsTrigger
                value="sent"
                className="relative rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <Send className="mr-2 h-4 w-4" />
                Sent
              </TabsTrigger>
              <TabsTrigger
                value="received"
                className="relative rounded-none border-b-2 border-b-transparent px-4 pb-3 pt-2 font-semibold text-muted-foreground data-[state=active]:border-b-primary data-[state=active]:text-foreground data-[state=active]:shadow-none"
              >
                <Mail className="mr-2 h-4 w-4" />
                Received
              </TabsTrigger>
            </TabsList>
            <TabsContent value="all" className="m-0 flex-1 overflow-hidden">
              <MailList
                threads={filteredThreads}
                selectedSubject={selectedSubject}
                onSelect={setSelectedSubject}
              />
            </TabsContent>
            <TabsContent value="sent" className="m-0 flex-1 overflow-hidden">
              <MailList
                threads={filteredThreads}
                selectedSubject={selectedSubject}
                onSelect={setSelectedSubject}
              />
            </TabsContent>
            <TabsContent value="received" className="m-0 flex-1 overflow-hidden">
              <MailList
                threads={filteredThreads}
                selectedSubject={selectedSubject}
                onSelect={setSelectedSubject}
              />
            </TabsContent>
          </Tabs>
        </ResizablePanel>

        <Separator orientation="vertical" />

        {/* Mail Detail Panel */}
        <ResizablePanel defaultSize="65%" minSize="30%">
          <MailDisplay thread={selectedThread} projectId={projectId} onFetchEmailDetail={onFetchEmailDetail} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </TooltipProvider>
  );
}

/* ── Mail List ─────────────────────────────────────────── */

interface MailListProps {
  threads: EmailThread[];
  selectedSubject: string | null;
  onSelect: (subject: string) => void;
}

function MailList({ threads, selectedSubject, onSelect }: MailListProps) {
  if (threads.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
        <Mail className="h-10 w-10 mb-3 opacity-40" />
        <p className="text-sm">No emails found</p>
      </div>
    );
  }

  return (
    <ScrollArea className="h-full">
      <div className="flex flex-col gap-2 p-4 pt-0">
        {threads.map((thread) => {
          const isSelected = thread.subject === selectedSubject;
          const lastEmail = thread.emails[thread.emails.length - 1];
          const displayName =
            lastEmail.direction === "sent"
              ? lastEmail.to[0]
              : lastEmail.from;
          const displayNameShort = displayName?.split("@")[0] ?? displayName;

          return (
            <button
              key={thread.subject}
              className={cn(
                "flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all hover:bg-accent",
                isSelected && "bg-muted"
              )}
              onClick={() => onSelect(thread.subject)}
            >
              <div className="flex w-full flex-col gap-1">
                <div className="flex items-center">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{displayNameShort}</span>
                    {thread.emails.length > 1 && (
                      <span className="text-xs text-muted-foreground">
                        ({thread.emails.length})
                      </span>
                    )}
                  </div>
                  <span
                    className={cn(
                      "ml-auto text-xs",
                      isSelected
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {formatRelativeDate(thread.lastDate)}
                  </span>
                </div>
                <span className="font-medium truncate w-full">
                  {thread.subject}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {thread.latestEvent && (
                  <StatusBadge event={thread.latestEvent} />
                )}
                {lastEmail.direction === "sent" && (
                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                    Sent
                  </Badge>
                )}
                {lastEmail.direction === "received" && (
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                    Received
                  </Badge>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

/* ── Mail Display ──────────────────────────────────────── */

interface MailDisplayProps {
  thread: EmailThread | null;
  projectId?: string;
  onFetchEmailDetail?: (emailId: string) => Promise<EmailDetail>;
}

function MailDisplay({ thread, projectId, onFetchEmailDetail }: MailDisplayProps) {
  const [bodies, setBodies] = useState<Record<string, EmailDetail>>({});
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set());
  const fetchedRef = useRef<Set<string>>(new Set());

  const fetchBody = useCallback(
    async (emailId: string) => {
      if (fetchedRef.current.has(emailId)) return;
      fetchedRef.current.add(emailId);
      setLoadingIds((prev) => new Set(prev).add(emailId));
      const detail = onFetchEmailDetail
        ? await onFetchEmailDetail(emailId)
        : await fetchEmailDetail(projectId!, emailId);
      setBodies((prev) => ({ ...prev, [emailId]: detail }));
      setLoadingIds((prev) => {
        const next = new Set(prev);
        next.delete(emailId);
        return next;
      });
    },
    [projectId, onFetchEmailDetail]
  );

  // Fetch all email bodies when thread changes
  useEffect(() => {
    if (!thread) return;
    for (const email of thread.emails) {
      fetchBody(email.id);
    }
  }, [thread, fetchBody]);

  if (!thread) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="flex flex-col items-center gap-2 text-muted-foreground">
          <Mail className="h-10 w-10 opacity-40" />
          <p className="text-sm">Select a conversation to view</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden">
      {/* Header */}
      <div className="flex shrink-0 items-start p-4">
        <div className="flex items-start gap-4 text-sm">
          <div className="grid gap-1">
            <div className="font-semibold text-base">{thread.subject}</div>
            <div className="text-xs text-muted-foreground">
              {thread.emails.length} message
              {thread.emails.length !== 1 ? "s" : ""}
            </div>
          </div>
        </div>
        <div className="ml-auto text-xs text-muted-foreground">
          {thread.participants.length} participant
          {thread.participants.length !== 1 ? "s" : ""}
        </div>
      </div>
      <Separator />

      {/* Messages */}
      <ScrollArea className="min-h-0 flex-1">
        <div className="flex flex-col gap-4 p-4">
          {thread.emails.map((email) => {
            const body = bodies[email.id];
            const isBodyLoading = loadingIds.has(email.id);

            return (
              <div
                key={email.id}
                className={cn(
                  "flex flex-col gap-2 rounded-lg border p-4",
                  email.direction === "sent"
                    ? "bg-muted/50"
                    : "bg-background"
                )}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    {email.direction === "sent" ? (
                      <ArrowUp className="h-4 w-4 text-muted-foreground" />
                    ) : (
                      <ArrowDown className="h-4 w-4 text-muted-foreground" />
                    )}
                    <span className="font-semibold text-sm">
                      {email.from}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {email.direction === "sent" && email.last_event && (
                      <StatusBadge event={email.last_event} />
                    )}
                    <time className="text-xs text-muted-foreground">
                      {formatDateTime(email.created_at)}
                    </time>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground">
                  To: {email.to.join(", ")}
                </div>
                <Separator className="my-1" />
                <EmailBody body={body} isLoading={isBodyLoading} />
              </div>
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}

/* ── Email Body Renderer ──────────────────────────────── */

interface EmailBodyProps {
  body: EmailDetail | undefined;
  isLoading: boolean;
}

function EmailBody({ body, isLoading }: EmailBodyProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Auto-resize iframe to fit content
  const handleIframeLoad = useCallback(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument?.body) return;
    const height = iframe.contentDocument.body.scrollHeight;
    iframe.style.height = `${height + 16}px`;
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 py-4 text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        <span className="text-sm">Loading email content...</span>
      </div>
    );
  }

  if (!body) return null;

  if (body.error) {
    return (
      <p className="text-sm text-muted-foreground italic py-2">
        {body.error}
      </p>
    );
  }

  if (body.html) {
    const srcdoc = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
              font-size: 14px;
              line-height: 1.6;
              color: #e4e4e7;
              background: transparent;
              margin: 0;
              padding: 0;
              word-wrap: break-word;
              overflow-wrap: break-word;
            }
            a { color: #60a5fa; }
            img { max-width: 100%; height: auto; }
            table { max-width: 100% !important; }
          </style>
        </head>
        <body>${body.html}</body>
      </html>
    `;

    return (
      <iframe
        ref={iframeRef}
        srcDoc={srcdoc}
        sandbox="allow-same-origin"
        onLoad={handleIframeLoad}
        className="w-full border-0 min-h-[60px]"
        title="Email content"
      />
    );
  }

  if (body.text) {
    return (
      <pre className="text-sm whitespace-pre-wrap font-sans text-foreground">
        {body.text}
      </pre>
    );
  }

  return (
    <p className="text-sm text-muted-foreground italic py-2">
      No content available
    </p>
  );
}

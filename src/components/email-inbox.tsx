"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Pencil,
  Reply,
  ReplyAll,
} from "lucide-react";
import { formatDateTime, cn } from "@/lib/utils";
import { fetchEmails, fetchEmailDetail } from "@/actions/email-config";
import { EmailComposeDialog } from "@/components/email-compose-dialog";
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
} from "@/components/ui/empty";
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

// Module-level cache: survives SPA navigations, cleared on page refresh
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
interface EmailCache {
  sent: ResendSentEmail[];
  received: ResendReceivedEmail[];
  timestamp: number;
}
const emailCache = new Map<string, EmailCache>();

interface EmailInboxProps {
  projectId?: string;
  onFetchEmails?: FetchEmailsFn;
  onFetchEmailDetail?: FetchEmailDetailFn;
  showCompose?: boolean;
}

export function EmailInbox({ projectId, onFetchEmails, onFetchEmailDetail, showCompose }: EmailInboxProps) {
  const cacheKey = projectId ?? "_owner";
  const cached = emailCache.get(cacheKey);
  const [sent, setSent] = useState<ResendSentEmail[]>(cached?.sent ?? []);
  const [received, setReceived] = useState<ResendReceivedEmail[]>(cached?.received ?? []);
  const [isLoading, startTransition] = useTransition();
  const [filter, setFilter] = useState<FilterType>("all");
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [composeOpen, setComposeOpen] = useState(false);
  const [replyTo, setReplyTo] = useState("");
  const [replySubject, setReplySubject] = useState("");

  const loadEmails = (force = false) => {
    if (!force) {
      const entry = emailCache.get(cacheKey);
      if (entry && Date.now() - entry.timestamp < CACHE_TTL) {
        setSent(entry.sent);
        setReceived(entry.received);
        return;
      }
    }

    startTransition(async () => {
      const result = onFetchEmails
        ? await onFetchEmails()
        : await fetchEmails(projectId!);
      setSent(result.sent);
      setReceived(result.received);
      emailCache.set(cacheKey, {
        sent: result.sent,
        received: result.received,
        timestamp: Date.now(),
      });
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
          <div className="flex h-full flex-col overflow-hidden">
            <div className="flex items-center px-4 py-2">
              <h2 className="text-xl font-bold">Inbox</h2>
              <div className="ml-auto flex items-center gap-1">
                {showCompose && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => {
                          setReplyTo("");
                          setReplySubject("");
                          setComposeOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Compose</span>
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>Compose email</TooltipContent>
                  </Tooltip>
                )}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => loadEmails(true)}
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
            <Tabs
              defaultValue="all"
              onValueChange={(v) => {
                setFilter(v as FilterType);
                setSelectedSubject(null);
              }}
            >
              <TabsList className="mx-4 mb-2">
                <TabsTrigger value="all">
                  <Inbox className="h-4 w-4" />
                  All
                </TabsTrigger>
                <TabsTrigger value="sent">
                  <Send className="h-4 w-4" />
                  Sent
                </TabsTrigger>
                <TabsTrigger value="received">
                  <Mail className="h-4 w-4" />
                  Received
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="flex-1 overflow-hidden">
              <MailList
                threads={filteredThreads}
                selectedSubject={selectedSubject}
                onSelect={setSelectedSubject}
              />
            </div>
          </div>
        </ResizablePanel>

        <Separator orientation="vertical" />

        {/* Mail Detail Panel */}
        <ResizablePanel defaultSize="65%" minSize="30%">
          <MailDisplay
            thread={selectedThread}
            projectId={projectId}
            onFetchEmailDetail={onFetchEmailDetail}
            onReply={showCompose ? (data) => {
              setReplyTo(data.to);
              setReplySubject(data.subject);
              setComposeOpen(true);
            } : undefined}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
      {showCompose && (
        <EmailComposeDialog
          open={composeOpen}
          onOpenChange={(open) => {
            setComposeOpen(open);
            if (!open) {
              setReplyTo("");
              setReplySubject("");
            }
          }}
          defaultTo={replyTo}
          defaultSubject={replySubject}
        />
      )}
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
      <Empty className="my-8 border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Mail />
          </EmptyMedia>
          <EmptyTitle>No emails found</EmptyTitle>
          <EmptyDescription>
            Your inbox is empty. Try refreshing or adjusting your search.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
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

interface ReplyData {
  to: string;
  subject: string;
}

interface MailDisplayProps {
  thread: EmailThread | null;
  projectId?: string;
  onFetchEmailDetail?: (emailId: string) => Promise<EmailDetail>;
  onReply?: (data: ReplyData) => void;
}

function MailDisplay({ thread, projectId, onFetchEmailDetail, onReply }: MailDisplayProps) {
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
      <Empty className="h-full border-0">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Mail />
          </EmptyMedia>
          <EmptyTitle>No conversation selected</EmptyTitle>
          <EmptyDescription>
            Select a conversation from the list to view its content.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
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
                <div className="flex items-center justify-between">
                  <div className="text-xs text-muted-foreground">
                    To: {email.to.join(", ")}
                  </div>
                  {onReply && (
                    <div className="flex items-center gap-1">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            onClick={() => {
                              const replyTo = email.direction === "received"
                                ? email.from.replace(/.*<(.+)>/, "$1")
                                : email.to[0];
                              const subject = thread.subject.startsWith("Re:")
                                ? thread.subject
                                : `Re: ${thread.subject}`;
                              onReply({ to: replyTo, subject });
                            }}
                          >
                            <Reply className="h-3.5 w-3.5" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Reply</TooltipContent>
                      </Tooltip>
                      {email.to.length > 1 && (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-7 w-7"
                              onClick={() => {
                                const allAddrs = new Set<string>();
                                allAddrs.add(email.from.replace(/.*<(.+)>/, "$1"));
                                email.to.forEach((a) => allAddrs.add(a));
                                const subject = thread.subject.startsWith("Re:")
                                  ? thread.subject
                                  : `Re: ${thread.subject}`;
                                onReply({ to: Array.from(allAddrs).join(", "), subject });
                              }}
                            >
                              <ReplyAll className="h-3.5 w-3.5" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Reply All</TooltipContent>
                        </Tooltip>
                      )}
                    </div>
                  )}
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

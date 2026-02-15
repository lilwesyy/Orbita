"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  IconBrush,
  IconChartBar,
  IconClock,
  IconDashboard,
  IconDatabase,
  IconFile,
  IconFileDescription,
  IconFolder,
  IconLock,
  IconListCheck,
  IconLoader2,
  IconMail,
  IconBrandGithub,
  IconSeo,
  IconSettings,
  IconSparkles,
  IconUserCircle,
  IconUsers,
} from "@tabler/icons-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { globalSearch, type SearchResults } from "@/actions/search";

const emptyResults: SearchResults = {
  clients: [],
  projects: [],
  tasks: [],
  invoices: [],
};

interface QuickAction {
  label: string;
  keywords: string[];
  url: string;
  icon: typeof IconDashboard;
  description: string;
}

const globalActions: QuickAction[] = [
  { label: "Dashboard", keywords: ["dashboard", "home", "overview", "panoramica"], url: "/", icon: IconDashboard, description: "Go to dashboard" },
  { label: "Clients", keywords: ["client", "clienti", "customer", "contatti"], url: "/clients", icon: IconUsers, description: "Manage clients" },
  { label: "Projects", keywords: ["project", "progetti", "progetto"], url: "/projects", icon: IconFolder, description: "Manage projects" },
  { label: "Time Tracking", keywords: ["time", "timer", "ore", "tempo", "tracking"], url: "/time-tracking", icon: IconClock, description: "Track time" },
  { label: "Invoices", keywords: ["invoice", "fattura", "fatture", "billing"], url: "/invoices", icon: IconFileDescription, description: "Manage invoices" },
  { label: "Analytics", keywords: ["analytics", "analisi", "statistiche", "grafici", "chart"], url: "/analytics", icon: IconChartBar, description: "View analytics" },
  { label: "Email", keywords: ["email", "mail", "inbox", "posta"], url: "/email", icon: IconMail, description: "Email inbox" },
  { label: "Account", keywords: ["account", "profilo", "profile", "avatar"], url: "/account", icon: IconUserCircle, description: "Account settings" },
  { label: "Settings", keywords: ["settings", "impostazioni", "api key", "config"], url: "/settings", icon: IconSettings, description: "Global settings" },
  { label: "New Client", keywords: ["new client", "nuovo cliente", "aggiungi cliente", "crea cliente"], url: "/clients/new", icon: IconUsers, description: "Create a new client" },
  { label: "New Project", keywords: ["new project", "nuovo progetto", "aggiungi progetto", "crea progetto"], url: "/projects/new", icon: IconFolder, description: "Create a new project" },
  { label: "New Invoice", keywords: ["new invoice", "nuova fattura", "aggiungi fattura", "crea fattura"], url: "/invoices/new", icon: IconFileDescription, description: "Create a new invoice" },
];

// Actions that require a project context — {id} is replaced at runtime
const projectActions: QuickAction[] = [
  { label: "Overview", keywords: ["overview", "panoramica", "dettagli"], url: "/projects/{id}", icon: IconDashboard, description: "Project overview" },
  { label: "Tasks", keywords: ["task", "tasks", "attività", "todo"], url: "/projects/{id}/tasks", icon: IconListCheck, description: "Project tasks" },
  { label: "Time", keywords: ["time", "ore", "tempo"], url: "/projects/{id}/time", icon: IconClock, description: "Project time entries" },
  { label: "SEO Checker", keywords: ["seo", "audit", "check", "sito", "website"], url: "/projects/{id}/seo", icon: IconSeo, description: "SEO audit" },
  { label: "Branding", keywords: ["brand", "branding", "logo", "favicon"], url: "/projects/{id}/branding", icon: IconBrush, description: "Branding & logos" },
  { label: "Ad Maker", keywords: ["ad", "ads", "advertising", "pubblicità", "creatività", "banner"], url: "/projects/{id}/ad-maker", icon: IconSparkles, description: "AI Ad Maker" },
  { label: "GitHub", keywords: ["github", "git", "repo", "repository", "commit"], url: "/projects/{id}/github", icon: IconBrandGithub, description: "GitHub integration" },
  { label: "Credentials", keywords: ["credential", "credenziali", "password", "vault", "chiave"], url: "/projects/{id}/credentials", icon: IconLock, description: "Credential vault" },
  { label: "Email", keywords: ["email", "mail", "posta"], url: "/projects/{id}/email", icon: IconMail, description: "Project email" },
  { label: "Database", keywords: ["database", "db", "dati"], url: "/projects/{id}/database", icon: IconDatabase, description: "Project database" },
  { label: "Files", keywords: ["file", "files", "documenti"], url: "/projects/{id}/files", icon: IconFile, description: "Project files" },
];

function matchesQuery(action: QuickAction, q: string): boolean {
  const lower = q.toLowerCase();
  return (
    action.label.toLowerCase().includes(lower) ||
    action.keywords.some((k) => k.includes(lower))
  );
}

export function SearchDialog() {
  const router = useRouter();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(emptyResults);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect project context from URL
  const activeProjectId = useMemo(() => {
    const match = pathname.match(/^\/projects\/([^/]+)/);
    const id = match?.[1];
    return id && id !== "new" ? id : null;
  }, [pathname]);

  // Build resolved project actions for current context
  const resolvedProjectActions = useMemo(() => {
    if (!activeProjectId) return [];
    return projectActions.map((a) => ({
      ...a,
      url: a.url.replace("{id}", activeProjectId),
    }));
  }, [activeProjectId]);

  // Cmd+K / Ctrl+K shortcut
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  // Debounced search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults(emptyResults);
      setLoading(false);
      return;
    }

    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      try {
        const data = await globalSearch(query);
        setResults(data);
      } catch {
        setResults(emptyResults);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const navigate = useCallback(
    (url: string) => {
      setOpen(false);
      setQuery("");
      setResults(emptyResults);
      router.push(url);
    },
    [router]
  );

  const matchedGlobal = query.trim().length >= 2
    ? globalActions.filter((a) => matchesQuery(a, query))
    : [];

  const matchedProject = query.trim().length >= 2
    ? resolvedProjectActions.filter((a) => matchesQuery(a, query))
    : [];

  const hasResults =
    matchedGlobal.length > 0 ||
    matchedProject.length > 0 ||
    results.clients.length > 0 ||
    results.projects.length > 0 ||
    results.tasks.length > 0 ||
    results.invoices.length > 0;

  return (
    <CommandDialog
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) {
          setQuery("");
          setResults(emptyResults);
        }
      }}
      title="Search"
      description="Search clients, projects, tasks, and invoices"
      showCloseButton={false}
      shouldFilter={false}
    >
      <CommandInput
        placeholder="Search..."
        value={query}
        onValueChange={setQuery}
      />
      <CommandList>
        {loading && (
          <div className="flex items-center justify-center py-6">
            <IconLoader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && query.trim().length >= 2 && !hasResults && (
          <CommandEmpty>No results found.</CommandEmpty>
        )}

        {!loading && matchedProject.length > 0 && (
          <CommandGroup heading="Project">
            {matchedProject.map((a) => (
              <CommandItem
                key={a.url}
                value={`project-action-${a.label}`}
                onSelect={() => navigate(a.url)}
              >
                <a.icon className="mr-2 size-4" />
                <span>{a.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {a.description}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!loading && matchedGlobal.length > 0 && (
          <CommandGroup heading="Quick Actions">
            {matchedGlobal.map((a) => (
              <CommandItem
                key={a.url + a.label}
                value={`action-${a.label}`}
                onSelect={() => navigate(a.url)}
              >
                <a.icon className="mr-2 size-4" />
                <span>{a.label}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {a.description}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!loading && results.clients.length > 0 && (
          <CommandGroup heading="Clients">
            {results.clients.map((c) => (
              <CommandItem
                key={c.id}
                value={`client-${c.id}`}
                onSelect={() => navigate(`/clients?open=${c.id}`)}
              >
                <IconUsers className="mr-2 size-4" />
                <span>{c.name}</span>
                {c.company && (
                  <span className="ml-auto text-xs text-muted-foreground">
                    {c.company}
                  </span>
                )}
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!loading && results.projects.length > 0 && (
          <CommandGroup heading="Projects">
            {results.projects.map((p) => (
              <CommandItem
                key={p.id}
                value={`project-${p.id}`}
                onSelect={() => navigate(`/projects/${p.id}`)}
              >
                <IconFolder className="mr-2 size-4" />
                <span>{p.name}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {p.status}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!loading && results.tasks.length > 0 && (
          <CommandGroup heading="Tasks">
            {results.tasks.map((t) => (
              <CommandItem
                key={t.id}
                value={`task-${t.id}`}
                onSelect={() => navigate(`/projects/${t.projectId}/tasks`)}
              >
                <IconListCheck className="mr-2 size-4" />
                <span>{t.title}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {t.projectName}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {!loading && results.invoices.length > 0 && (
          <CommandGroup heading="Invoices">
            {results.invoices.map((i) => (
              <CommandItem
                key={i.id}
                value={`invoice-${i.id}`}
                onSelect={() => navigate(`/invoices/${i.id}`)}
              >
                <IconFileDescription className="mr-2 size-4" />
                <span>{i.number}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {i.clientName} &middot; {i.status}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}

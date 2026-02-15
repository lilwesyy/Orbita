"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  IconUsers,
  IconFolder,
  IconListCheck,
  IconFileDescription,
  IconLoader2,
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

export function SearchDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResults>(emptyResults);
  const [loading, setLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const hasResults =
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

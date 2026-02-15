"use client";

import {
  useState,
  useCallback,
  useMemo,
  useActionState,
  useEffect,
  useRef,
  useTransition,
} from "react";
import { toast } from "sonner";
import {
  Plus,
  MoreHorizontal,
  Eye,
  EyeOff,
  Copy,
  ExternalLink,
  Pencil,
  Trash2,
  RefreshCw,
  Server,
  Globe,
  Upload,
  Mail,
  Database,
  Share2,
  Key,
  Lock,
  Shield,
} from "lucide-react";
import type { ColumnDef } from "@tanstack/react-table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { DataTable } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createCredential,
  updateCredential,
  deleteCredential,
  getDecryptedPassword,
} from "@/actions/credentials";
import { formatDate } from "@/lib/utils";
import ConfirmModal from "@/components/confirm-modal";

// --- Types ---

interface CredentialData {
  id: string;
  label: string;
  category: string;
  username: string | null;
  url: string | null;
  notes: string | null;
  hasPassword: boolean;
  createdAt: Date;
  updatedAt: Date;
}

type CategoryKey =
  | "hosting"
  | "cms"
  | "ftp"
  | "email"
  | "database"
  | "social"
  | "api"
  | "other";

interface CategoryConfig {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  variant: "default" | "secondary" | "outline" | "warning" | "destructive" | "success";
}

// --- Config ---

const categoryConfig: Record<CategoryKey, CategoryConfig> = {
  hosting: { label: "Hosting", icon: Server, variant: "default" },
  cms: { label: "CMS", icon: Globe, variant: "secondary" },
  ftp: { label: "FTP", icon: Upload, variant: "outline" },
  email: { label: "Email", icon: Mail, variant: "warning" },
  database: { label: "Database", icon: Database, variant: "destructive" },
  social: { label: "Social", icon: Share2, variant: "success" },
  api: { label: "API", icon: Key, variant: "default" },
  other: { label: "Other", icon: Lock, variant: "secondary" },
};

const categories: CategoryKey[] = [
  "hosting",
  "cms",
  "ftp",
  "email",
  "database",
  "social",
  "api",
  "other",
];

// --- Password Generator ---

interface PasswordGeneratorProps {
  onUse: (password: string) => void;
}

function generatePassword(
  length: number,
  options: { uppercase: boolean; lowercase: boolean; numbers: boolean; symbols: boolean }
): string {
  let chars = "";
  if (options.uppercase) chars += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (options.lowercase) chars += "abcdefghijklmnopqrstuvwxyz";
  if (options.numbers) chars += "0123456789";
  if (options.symbols) chars += "!@#$%^&*()_+-=[]{}|;:,.<>?";
  if (chars === "") chars = "abcdefghijklmnopqrstuvwxyz";

  const array = new Uint32Array(length);
  crypto.getRandomValues(array);
  return Array.from(array, (n) => chars[n % chars.length]).join("");
}

function PasswordGeneratorPopover({ onUse }: PasswordGeneratorProps) {
  const [length, setLength] = useState(16);
  const [uppercase, setUppercase] = useState(true);
  const [lowercase, setLowercase] = useState(true);
  const [numbers, setNumbers] = useState(true);
  const [symbols, setSymbols] = useState(true);
  const [preview, setPreview] = useState(() =>
    generatePassword(16, { uppercase: true, lowercase: true, numbers: true, symbols: true })
  );

  const regenerate = useCallback(() => {
    setPreview(generatePassword(length, { uppercase, lowercase, numbers, symbols }));
  }, [length, uppercase, lowercase, numbers, symbols]);

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm">
          <Key className="size-4" />
          Generate
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80" align="start">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Length: {length}</Label>
            <Input
              type="range"
              min={8}
              max={64}
              value={length}
              onChange={(e) => setLength(Number(e.target.value))}
              className="h-2"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <Checkbox
                id="gen-upper"
                checked={uppercase}
                onCheckedChange={(v) => setUppercase(!!v)}
              />
              <Label htmlFor="gen-upper" className="text-sm font-normal">
                Uppercase
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="gen-lower"
                checked={lowercase}
                onCheckedChange={(v) => setLowercase(!!v)}
              />
              <Label htmlFor="gen-lower" className="text-sm font-normal">
                Lowercase
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="gen-numbers"
                checked={numbers}
                onCheckedChange={(v) => setNumbers(!!v)}
              />
              <Label htmlFor="gen-numbers" className="text-sm font-normal">
                Numbers
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Checkbox
                id="gen-symbols"
                checked={symbols}
                onCheckedChange={(v) => setSymbols(!!v)}
              />
              <Label htmlFor="gen-symbols" className="text-sm font-normal">
                Symbols
              </Label>
            </div>
          </div>
          <div className="rounded-md bg-muted p-2">
            <code className="text-xs break-all">{preview}</code>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={regenerate}
              className="flex-1"
            >
              <RefreshCw className="size-3" />
              Regenerate
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => onUse(preview)}
              className="flex-1"
            >
              Use this
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}

// --- Row Actions ---

interface CredentialRowActionsProps {
  credential: CredentialData;
  projectId: string;
  onEdit: (credential: CredentialData) => void;
  onDelete: (id: string, label: string) => void;
}

function CredentialRowActions({
  credential,
  projectId,
  onEdit,
  onDelete,
}: CredentialRowActionsProps) {
  const [isPending, startTransition] = useTransition();

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch {
      toast.error("Failed to copy");
    }
  };

  const handleCopyUsername = () => {
    if (credential.username) {
      copyToClipboard(credential.username, "Username");
    }
  };

  const handleCopyPassword = () => {
    startTransition(async () => {
      const result = await getDecryptedPassword(credential.id);
      if (result.error) {
        toast.error(result.error);
      } else if (result.password) {
        await copyToClipboard(result.password, "Password");
      }
    });
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="size-8">
          <MoreHorizontal className="size-4" />
          <span className="sr-only">Open menu</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Actions</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {credential.username && (
          <DropdownMenuItem onClick={handleCopyUsername}>
            <Copy className="size-4" />
            Copy username
          </DropdownMenuItem>
        )}
        {credential.hasPassword && (
          <DropdownMenuItem onClick={handleCopyPassword} disabled={isPending}>
            <Key className="size-4" />
            Copy password
          </DropdownMenuItem>
        )}
        {credential.url && (
          <DropdownMenuItem asChild>
            <a href={credential.url} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="size-4" />
              Open URL
            </a>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={() => onEdit(credential)}>
          <Pencil className="size-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem variant="destructive" onClick={() => onDelete(credential.id, credential.label)}>
          <Trash2 className="size-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// --- Password Cell ---

function PasswordCell({ credentialId, hasPassword }: { credentialId: string; hasPassword: boolean }) {
  const [visible, setVisible] = useState(false);
  const [password, setPassword] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  if (!hasPassword) {
    return <span className="text-muted-foreground text-sm">-</span>;
  }

  const handleToggle = () => {
    if (visible) {
      setVisible(false);
      setPassword(null);
      return;
    }
    startTransition(async () => {
      const result = await getDecryptedPassword(credentialId);
      if (result.error) {
        toast.error(result.error);
      } else {
        setPassword(result.password ?? null);
        setVisible(true);
      }
    });
  };

  const handleCopy = () => {
    startTransition(async () => {
      const decrypted = password ?? (await getDecryptedPassword(credentialId)).password;
      if (decrypted) {
        try {
          await navigator.clipboard.writeText(decrypted);
          toast.success("Password copied");
        } catch {
          toast.error("Failed to copy");
        }
      } else {
        toast.error("No password to copy");
      }
    });
  };

  return (
    <div className="flex items-center gap-1">
      <span className="font-mono text-sm">
        {visible && password ? password : "••••••••"}
      </span>
      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        onClick={handleToggle}
        disabled={isPending}
      >
        {visible ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="size-6"
        onClick={handleCopy}
        disabled={isPending}
      >
        <Copy className="size-3" />
      </Button>
    </div>
  );
}

// --- Create Credential Dialog ---

interface CreateCredentialDialogProps {
  projectId: string;
}

function CreateCredentialDialog({ projectId }: CreateCredentialDialogProps) {
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const boundAction = createCredential.bind(null, projectId);
  const [state, formAction, isPending] = useActionState(boundAction, {});
  const prevStateRef = useRef(state);

  /* eslint-disable react-hooks/set-state-in-effect -- reacting to server action result */
  useEffect(() => {
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;
    if (state.error) {
      toast.error(state.error);
    } else if (state.success) {
      toast.success("Credential created");
      setPassword("");
      setShowPassword(false);
      setOpen(false);
    }
  }, [state]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus /> New Credential
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Add Credential</DialogTitle>
          <DialogDescription>
            Store a new credential securely in this project vault.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="password" value={password} />
          <div className="space-y-2">
            <Label htmlFor="label">Label *</Label>
            <Input
              id="label"
              name="label"
              placeholder="e.g. Hosting Aruba, WordPress Admin"
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select name="category" defaultValue="other" disabled={isPending}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => {
                  const config = categoryConfig[cat];
                  return (
                    <SelectItem key={cat} value={cat}>
                      {config.label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="create-password">Password</Label>
              <PasswordGeneratorPopover onUse={(p) => { setPassword(p); setShowPassword(true); }} />
            </div>
            <div className="relative">
              <Input
                id="create-password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 size-9"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </Button>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              name="url"
              type="url"
              placeholder="https://"
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="notes">Notes</Label>
            <Textarea
              id="notes"
              name="notes"
              rows={3}
              disabled={isPending}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => setOpen(false)}
              disabled={isPending}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              <Plus /> Add Credential
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Edit Credential Dialog ---

interface EditCredentialDialogProps {
  credential: CredentialData | null;
  projectId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function EditCredentialDialog({
  credential,
  projectId,
  open,
  onOpenChange,
}: EditCredentialDialogProps) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [keepPassword, setKeepPassword] = useState(true);

  const boundAction = credential
    ? updateCredential.bind(null, credential.id, projectId)
    : async () => ({ error: "No credential selected" });
  const [state, formAction, isPending] = useActionState(boundAction, {});
  const prevStateRef = useRef(state);

  /* eslint-disable react-hooks/set-state-in-effect -- sync state when credential prop changes */
  useEffect(() => {
    if (credential) {
      setPassword("");
      setShowPassword(false);
      setKeepPassword(credential.hasPassword);
    }
  }, [credential]);
  /* eslint-enable react-hooks/set-state-in-effect */

  useEffect(() => {
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;
    if (state.error) {
      toast.error(state.error);
    } else if (state.success) {
      toast.success("Credential updated");
      onOpenChange(false);
    }
  }, [state, onOpenChange]);

  if (!credential) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit Credential</DialogTitle>
          <DialogDescription>
            Update this credential&apos;s details.
          </DialogDescription>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input
            type="hidden"
            name="password"
            value={keepPassword ? "" : password}
          />
          <input
            type="hidden"
            name="keepPassword"
            value={keepPassword ? "true" : "false"}
          />
          <div className="space-y-2">
            <Label htmlFor="edit-label">Label *</Label>
            <Input
              id="edit-label"
              name="label"
              defaultValue={credential.label}
              required
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label>Category</Label>
            <Select
              name="category"
              defaultValue={credential.category}
              disabled={isPending}
            >
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => {
                  const config = categoryConfig[cat];
                  return (
                    <SelectItem key={cat} value={cat}>
                      {config.label}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-username">Username</Label>
            <Input
              id="edit-username"
              name="username"
              defaultValue={credential.username || ""}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Password</Label>
              {keepPassword ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setKeepPassword(false)}
                >
                  Change password
                </Button>
              ) : (
                <PasswordGeneratorPopover
                  onUse={(p) => {
                    setPassword(p);
                    setShowPassword(true);
                  }}
                />
              )}
            </div>
            {keepPassword ? (
              <p className="text-sm text-muted-foreground">
                Password unchanged. Click &quot;Change password&quot; to set a
                new one.
              </p>
            ) : (
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isPending}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 size-9"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </Button>
              </div>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-url">URL</Label>
            <Input
              id="edit-url"
              name="url"
              type="url"
              defaultValue={credential.url || ""}
              disabled={isPending}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-notes">Notes</Label>
            <Textarea
              id="edit-notes"
              name="notes"
              rows={3}
              defaultValue={credential.notes || ""}
              disabled={isPending}
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
              type="button"
            >
              Cancel
            </Button>
            <Button type="submit" loading={isPending}>
              Save Changes
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// --- Columns ---

function getColumns(
  projectId: string,
  onEdit: (credential: CredentialData) => void,
  onDelete: (id: string, label: string) => void
): ColumnDef<CredentialData>[] {
  return [
    {
      accessorKey: "category",
      header: "Category",
      cell: ({ row }) => {
        const cat = row.original.category as CategoryKey;
        const config = categoryConfig[cat] || categoryConfig.other;
        const Icon = config.icon;
        return (
          <Badge variant={config.variant} className="gap-1">
            <Icon className="size-3" />
            {config.label}
          </Badge>
        );
      },
      filterFn: (row, id, value: string[]) => {
        return value.includes(row.getValue(id));
      },
    },
    {
      accessorKey: "label",
      header: "Label",
      cell: ({ row }) => (
        <span className="font-medium">{row.original.label}</span>
      ),
    },
    {
      accessorKey: "username",
      header: "Username",
      cell: ({ row }) => {
        const username = row.original.username;
        if (!username) return <span className="text-muted-foreground text-sm">-</span>;
        return (
          <div className="flex items-center gap-1">
            <span className="font-mono text-sm">{username}</span>
            <Button
              variant="ghost"
              size="icon"
              className="size-6"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(username);
                  toast.success("Username copied");
                } catch {
                  toast.error("Failed to copy");
                }
              }}
            >
              <Copy className="size-3" />
            </Button>
          </div>
        );
      },
    },
    {
      id: "password",
      header: "Password",
      cell: ({ row }) => (
        <PasswordCell
          credentialId={row.original.id}
          hasPassword={row.original.hasPassword}
        />
      ),
    },
    {
      accessorKey: "url",
      header: "URL",
      cell: ({ row }) => {
        const url = row.original.url;
        if (!url) return <span className="text-muted-foreground text-sm">-</span>;
        let display: string;
        try {
          display = new URL(url).hostname;
        } catch {
          display = url;
        }
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {display}
            <ExternalLink className="size-3" />
          </a>
        );
      },
    },
    {
      accessorKey: "createdAt",
      header: "Created",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    },
    {
      id: "actions",
      enableHiding: false,
      enableSorting: false,
      cell: ({ row }) => (
        <CredentialRowActions
          credential={row.original}
          projectId={projectId}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ),
    },
  ];
}

// --- Main Component ---

interface CredentialVaultProps {
  credentials: CredentialData[];
  projectId: string;
}

export function CredentialVault({
  credentials,
  projectId,
}: CredentialVaultProps) {
  const [editingCredential, setEditingCredential] =
    useState<CredentialData | null>(null);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteLabel, setDeleteLabel] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const deleteIdRef = useRef<string | null>(null);

  const handleEdit = useCallback((credential: CredentialData) => {
    setEditingCredential(credential);
    setEditOpen(true);
  }, []);

  const handleDeleteRequest = useCallback((id: string, label: string) => {
    deleteIdRef.current = id;
    setDeleteLabel(label);
    setDeleteOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteIdRef.current) return;
    setIsDeleting(true);
    await deleteCredential(deleteIdRef.current, projectId);
    setIsDeleting(false);
    setDeleteOpen(false);
  }, [projectId]);

  const columns = useMemo(
    () => getColumns(projectId, handleEdit, handleDeleteRequest),
    [projectId, handleEdit, handleDeleteRequest]
  );

  return (
    <>
      <DataTable
        columns={columns}
        data={credentials}
        searchKey="label"
        searchPlaceholder="Filter credentials..."
        emptyMessage={
          <Empty className="border-none">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <Shield />
              </EmptyMedia>
              <EmptyTitle>No Credentials</EmptyTitle>
              <EmptyDescription>
                Store passwords, API keys, and access credentials securely.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        }
        action={<CreateCredentialDialog projectId={projectId} />}
      />
      <EditCredentialDialog
        credential={editingCredential}
        projectId={projectId}
        open={editOpen}
        onOpenChange={setEditOpen}
      />
      <ConfirmModal
        isOpen={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Delete Credential"
        message={`Are you sure you want to delete "${deleteLabel}"? This action is irreversible.`}
        isLoading={isDeleting}
      />
    </>
  );
}

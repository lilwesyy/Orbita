"use client";

import { useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Plus, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import AddressAutocomplete from "@/components/address-autocomplete";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { Client, ClientStatus } from "@/generated/prisma/client";

interface ClientFormState {
  error?: string;
  success?: boolean;
}

interface ClientFormProps {
  client?: Client;
  action: (
    prevState: ClientFormState,
    formData: FormData
  ) => Promise<ClientFormState>;
  onSuccess?: () => void;
}

const statusOptions: Array<{ value: ClientStatus; label: string }> = [
  { value: "ACTIVE", label: "Active" },
  { value: "INACTIVE", label: "Inactive" },
  { value: "LEAD", label: "Lead" },
];

export default function ClientForm({ client, action, onSuccess }: ClientFormProps) {
  const [state, formAction, isPending] = useActionState<ClientFormState, FormData>(
    action,
    {}
  );

  const prevStateRef = useRef(state);

  useEffect(() => {
    if (state === prevStateRef.current) return;
    prevStateRef.current = state;
    if (state.error) {
      toast.error(state.error);
    } else if (state.success) {
      toast.success(client ? "Client updated" : "Client created");
      onSuccess?.();
    }
  }, [state, client, onSuccess]);

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            name="name"
            placeholder="Client name"
            defaultValue={client?.name ?? ""}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            placeholder="email@example.com"
            defaultValue={client?.email ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input
            id="phone"
            name="phone"
            placeholder="+39 123 456 7890"
            defaultValue={client?.phone ?? ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="company">Company</Label>
          <Input
            id="company"
            name="company"
            placeholder="Company name"
            defaultValue={client?.company ?? ""}
          />
        </div>
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="address">Address</Label>
          <AddressAutocomplete
            name="address"
            defaultValue={client?.address ?? ""}
            placeholder="Search address..."
          />
        </div>
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="status">Status</Label>
          <Select name="status" defaultValue={client?.status ?? "ACTIVE"}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statusOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Client notes..."
            defaultValue={client?.notes ?? ""}
            rows={3}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          loading={isPending}
        >
          {client ? <><Save /> Update</> : <><Plus /> Create Client</>}
        </Button>
      </div>
    </form>
  );
}

"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { Plus, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import type { InvoiceWithRelations, SerializedInvoice, InvoiceItemFormData } from "@/types/invoice";
import LineItemEditor from "./line-item-editor";

interface ClientOption {
  id: string;
  name: string;
}

interface ProjectOption {
  id: string;
  name: string;
}

interface InvoiceFormState {
  error?: string;
  success?: boolean;
}

type InvoiceFormAction = (
  prevState: InvoiceFormState,
  formData: FormData
) => Promise<InvoiceFormState>;

interface InvoiceFormProps {
  invoice?: InvoiceWithRelations | SerializedInvoice;
  clients: ClientOption[];
  projects: ProjectOption[];
  action: InvoiceFormAction;
  onSuccess?: () => void;
}

const typeOptions = [
  { value: "INVOICE", label: "Invoice" },
  { value: "QUOTE", label: "Quote" },
];

function formatDateForInput(date: Date | string | null | undefined): string {
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
}

function createDefaultItem(): InvoiceItemFormData {
  return {
    description: "",
    quantity: "1",
    unitPrice: "0",
    total: "0",
  };
}

function mapInvoiceItems(invoice: InvoiceWithRelations | SerializedInvoice): InvoiceItemFormData[] {
  return invoice.items.map((item) => ({
    id: item.id,
    description: item.description,
    quantity: String(item.quantity),
    unitPrice: String(item.unitPrice),
    total: String(item.total),
  }));
}

export default function InvoiceForm({
  invoice,
  clients,
  projects,
  action,
  onSuccess,
}: InvoiceFormProps) {
  const [state, formAction, isPending] = useActionState<InvoiceFormState, FormData>(
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
      toast.success(invoice ? "Invoice updated" : "Invoice created");
      onSuccess?.();
    }
  }, [state, invoice, onSuccess]);

  const [items, setItems] = useState<InvoiceItemFormData[]>(
    invoice ? mapInvoiceItems(invoice) : [createDefaultItem()]
  );

  const [taxRate, setTaxRate] = useState<string>(
    invoice ? String(invoice.taxRate) : "22"
  );

  const subtotal = items.reduce(
    (sum, item) => sum + (parseFloat(item.total) || 0),
    0
  );
  const taxRateNum = parseFloat(taxRate) || 0;
  const taxAmount = (subtotal * taxRateNum) / 100;
  const total = subtotal + taxAmount;

  return (
    <form
      action={(formData: FormData) => {
        formData.set("items", JSON.stringify(items));
        formAction(formData);
      }}
      className="space-y-8"
    >
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Document Type *</Label>
          <Select name="type" defaultValue={invoice?.type ?? "INVOICE"} required>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {typeOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Client *</Label>
          <Select name="clientId" defaultValue={invoice?.clientId ?? ""} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select client" />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Project (optional)</Label>
          <Select name="projectId" defaultValue={invoice?.projectId ?? ""}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select project" />
            </SelectTrigger>
            <SelectContent>
              {projects.map((project) => (
                <SelectItem key={project.id} value={project.id}>{project.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="date">Date *</Label>
          <Input
            id="date"
            name="date"
            type="date"
            defaultValue={formatDateForInput(invoice?.date) || formatDateForInput(new Date())}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input
            id="dueDate"
            name="dueDate"
            type="date"
            defaultValue={formatDateForInput(invoice?.dueDate)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="taxRate">Tax Rate (%)</Label>
          <Input
            id="taxRate"
            name="taxRate"
            type="number"
            value={taxRate}
            onChange={(e) => setTaxRate(e.target.value)}
            min="0"
            max="100"
            step="0.01"
          />
        </div>

        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea
            id="notes"
            name="notes"
            placeholder="Additional notes..."
            defaultValue={invoice?.notes ?? ""}
            rows={3}
          />
        </div>
      </div>

      <LineItemEditor items={items} onChange={setItems} />

      <div className="flex justify-end">
        <div className="w-full max-w-xs space-y-2 text-right">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal:</span>
            <span className="font-medium text-foreground">
              {new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(subtotal)}
            </span>
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>IVA ({taxRateNum}%):</span>
            <span className="font-medium text-foreground">
              {new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(taxAmount)}
            </span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t border-border pt-2">
            <span className="text-foreground">Total:</span>
            <span className="text-primary">
              {new Intl.NumberFormat("it-IT", { style: "currency", currency: "EUR" }).format(total)}
            </span>
          </div>
        </div>
      </div>

      <input type="hidden" name="items" value={JSON.stringify(items)} />

      <div className="flex justify-end gap-3">
        <Button
          type="submit"
          loading={isPending}
        >
          {invoice ? <><Save /> Update</> : <><Plus /> Create Document</>}
        </Button>
      </div>
    </form>
  );
}

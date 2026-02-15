"use client";

import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import { Plus, Trash2 } from "lucide-react";
import type { InvoiceItemFormData } from "@/types/invoice";

interface LineItemEditorProps {
  items: InvoiceItemFormData[];
  onChange: (items: InvoiceItemFormData[]) => void;
}

function createEmptyItem(): InvoiceItemFormData {
  return {
    description: "",
    quantity: "1",
    unitPrice: "0",
    total: "0",
  };
}

export default function LineItemEditor({ items, onChange }: LineItemEditorProps) {
  const updateItem = useCallback(
    (index: number, field: keyof InvoiceItemFormData, value: string) => {
      const updated = items.map((item, i) => {
        if (i !== index) return item;

        const newItem = { ...item, [field]: value };

        if (field === "quantity" || field === "unitPrice") {
          const qty = parseFloat(newItem.quantity) || 0;
          const price = parseFloat(newItem.unitPrice) || 0;
          newItem.total = (qty * price).toFixed(2);
        }

        return newItem;
      });
      onChange(updated);
    },
    [items, onChange]
  );

  const addItem = useCallback(() => {
    onChange([...items, createEmptyItem()]);
  }, [items, onChange]);

  const removeItem = useCallback(
    (index: number) => {
      if (items.length <= 1) return;
      onChange(items.filter((_, i) => i !== index));
    },
    [items, onChange]
  );

  const subtotal = items.reduce(
    (sum, item) => sum + (parseFloat(item.total) || 0),
    0
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">
          Line Items
        </h3>
        <Button
          size="sm"
          variant="secondary"
          onClick={addItem}
          type="button"
        >
          <Plus className="w-4 h-4 mr-1" />
          Add Item
        </Button>
      </div>

      <div className="hidden sm:grid sm:grid-cols-12 gap-2 text-sm font-medium text-muted-foreground px-1">
        <div className="col-span-5">Description</div>
        <div className="col-span-2">Quantity</div>
        <div className="col-span-2">Unit Price</div>
        <div className="col-span-2">Total</div>
        <div className="col-span-1"></div>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <div
            key={index}
            className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-start p-3 rounded-lg border border-border/50 sm:border-0 sm:p-0"
          >
            <div className="sm:col-span-5">
              <Label className="sm:hidden">Description</Label>
              <Input
                placeholder="Item description"
                value={item.description}
                onChange={(e) => updateItem(index, "description", e.target.value)}
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="sm:hidden">Quantity</Label>
              <Input
                type="number"
                placeholder="1"
                value={item.quantity}
                onChange={(e) => updateItem(index, "quantity", e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="sm:hidden">Unit Price</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={item.unitPrice}
                onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                min="0"
                step="0.01"
              />
            </div>
            <div className="sm:col-span-2">
              <Label className="sm:hidden">Total</Label>
              <Input
                value={item.total}
                readOnly
              />
            </div>
            <div className="sm:col-span-1 flex items-center justify-end sm:justify-center">
              <Button
                size="icon"
                variant="ghost"
                onClick={() => removeItem(index)}
                disabled={items.length <= 1}
                aria-label="Remove item"
                type="button"
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-end pt-2 border-t border-border">
        <div className="text-right">
          <span className="text-sm text-muted-foreground">Subtotal: </span>
          <span className="text-lg font-semibold text-foreground">
            {formatCurrency(subtotal.toFixed(2))}
          </span>
        </div>
      </div>
    </div>
  );
}

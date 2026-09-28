"use client";

import { Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { linkProductToIntegrationAction, unlinkProductIntegrationAction } from "@/core/integrations/actions";
import type { Integration, ProductIntegrationLinkWithProvider } from "@/core/integrations/queries";
import { pt } from "@/lib/i18n/dictionaries/pt";

export function ProductIntegrationLinks({
  productId,
  links,
  availableIntegrations,
}: {
  productId: string;
  links: ProductIntegrationLinkWithProvider[];
  availableIntegrations: Integration[];
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [integrationId, setIntegrationId] = useState("");
  const [externalProductId, setExternalProductId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleAdd() {
    if (!integrationId || !externalProductId.trim()) return;
    setIsSubmitting(true);
    const result = await linkProductToIntegrationAction(productId, integrationId, externalProductId.trim());
    setIsSubmitting(false);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    setOpen(false);
    setIntegrationId("");
    setExternalProductId("");
    router.refresh();
  }

  async function handleRemove(linkId: string) {
    const result = await unlinkProductIntegrationAction(linkId, productId);
    if (result?.error) {
      toast.error(result.error);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">{pt.integrations.productLinks.title}</h3>
        {availableIntegrations.length > 0 && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger render={<Button size="sm" />}>
              <Plus className="size-4" />
              {pt.integrations.productLinks.add}
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{pt.integrations.productLinks.add}</DialogTitle>
              </DialogHeader>
              <Select value={integrationId} onValueChange={(value) => setIntegrationId(value ?? "")}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder={pt.integrations.productLinks.selectIntegration} />
                </SelectTrigger>
                <SelectContent>
                  {availableIntegrations.map((integration) => (
                    <SelectItem key={integration.id} value={integration.id}>
                      {pt.integrations.providerNames[integration.provider]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                placeholder={pt.integrations.productLinks.externalIdLabel}
                value={externalProductId}
                onChange={(event) => setExternalProductId(event.target.value)}
              />
              <DialogFooter>
                <Button
                  type="button"
                  disabled={!integrationId || !externalProductId.trim() || isSubmitting}
                  onClick={handleAdd}
                >
                  {pt.integrations.productLinks.add}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {availableIntegrations.length === 0 && (
        <p className="text-sm text-muted-foreground">{pt.integrations.productLinks.noIntegrationsConnected}</p>
      )}

      {links.length === 0 ? (
        <p className="text-sm text-muted-foreground">{pt.integrations.productLinks.empty}</p>
      ) : (
        <div className="flex flex-col divide-y rounded-xl border">
          {links.map((link) => (
            <div key={link.id} className="flex items-center gap-3 p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{pt.integrations.providerNames[link.provider]}</p>
                <p className="truncate text-xs text-muted-foreground">{link.external_product_id}</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label={pt.integrations.productLinks.remove}
                onClick={() => handleRemove(link.id)}
              >
                <X className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

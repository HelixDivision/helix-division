"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { TextField } from "@/components/ui/text-field";
import type { Address } from "@/generated/prisma/client";
import { addressSchema, type AddressFormInput } from "@/lib/validations/account";
import {
  createAddressAction,
  deleteAddressAction,
  updateAddressAction,
} from "@/server/actions/account";

/**
 * Address book (Phase 8) — CRUD over the caller's own Address rows. All
 * mutations go through server/actions/account.ts (session re-checked there,
 * ownership scoped in server/services/user.ts); this component just manages
 * dialog state and refreshes the server-rendered list after each change.
 */
export function AddressBook({ addresses }: { addresses: Address[] }) {
  const [editing, setEditing] = useState<Address | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<Address | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  async function confirmDelete() {
    if (!deleting) return;
    setIsDeleting(true);
    const result = await deleteAddressAction(deleting.id);
    setIsDeleting(false);
    if (!result.success) {
      toast.error(result.error ?? "Could not delete address.");
      return;
    }
    toast.success("Address removed.");
    setDeleting(null);
    router.refresh();
  }

  return (
    <section className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <h2 className="font-heading text-foreground-primary text-lg tracking-wide uppercase">
          Addresses
        </h2>
        <Button size="sm" onClick={() => setCreating(true)}>
          <Plus className="size-4" /> Add Address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="border-border rounded-lg border p-8 text-center">
          <p className="text-foreground-muted text-sm">You haven&apos;t saved any addresses yet.</p>
        </div>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {addresses.map((address) => (
            <li
              key={address.id}
              className="border-border flex flex-col justify-between rounded-lg border p-5"
            >
              <p className="text-foreground-muted text-sm">
                {address.line1}
                {address.line2 ? `, ${address.line2}` : ""}
                <br />
                {address.city}
                {address.region ? `, ${address.region}` : ""} {address.postalCode}
                <br />
                {address.country}
                {address.phone ? (
                  <>
                    <br />
                    {address.phone}
                  </>
                ) : null}
              </p>
              <div className="mt-4 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(address)}>
                  <Pencil className="size-3.5" /> Edit
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setDeleting(address)}>
                  <Trash2 className="size-3.5" /> Remove
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add / edit share one dialog, keyed so the form resets between them. */}
      <Dialog
        open={creating || editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? "Edit Address" : "Add Address"}</DialogTitle>
          </DialogHeader>
          <AddressForm
            key={editing?.id ?? "new"}
            address={editing}
            onDone={() => {
              setCreating(false);
              setEditing(null);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={deleting !== null} onOpenChange={(open) => !open && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove Address</DialogTitle>
          </DialogHeader>
          <p className="text-foreground-muted text-sm">
            Are you sure you want to remove this address? This can&apos;t be undone.
          </p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleting(null)} disabled={isDeleting}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={confirmDelete} disabled={isDeleting}>
              {isDeleting ? "Removing..." : "Remove"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </section>
  );
}

function AddressForm({ address, onDone }: { address: Address | null; onDone: () => void }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddressFormInput>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      line1: address?.line1 ?? "",
      line2: address?.line2 ?? "",
      city: address?.city ?? "",
      region: address?.region ?? "",
      postalCode: address?.postalCode ?? "",
      country: address?.country ?? "",
      phone: address?.phone ?? "",
    },
    mode: "onBlur",
  });

  async function onSubmit(values: AddressFormInput) {
    setIsSubmitting(true);
    const result = address
      ? await updateAddressAction(address.id, values)
      : await createAddressAction(values);
    setIsSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          if (message) form.setError(field as keyof AddressFormInput, { message });
        }
      }
      toast.error(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    toast.success(address ? "Address updated." : "Address added.");
    onDone();
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <TextField name="line1" label="Address line 1" />
        <TextField name="line2" label="Address line 2 (optional)" />
        <div className="grid grid-cols-2 gap-4">
          <TextField name="city" label="City" />
          <TextField name="region" label="State / Region" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <TextField name="postalCode" label="Postal code" />
          <TextField name="country" label="Country" />
        </div>
        <TextField name="phone" label="Phone (optional)" />
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : address ? "Save Changes" : "Add Address"}
        </Button>
      </form>
    </FormProvider>
  );
}

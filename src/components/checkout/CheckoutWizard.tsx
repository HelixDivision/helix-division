"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { FormProvider, useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Field, FieldContent, FieldError, FieldLabel } from "@/components/ui/field";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { TextField } from "@/components/ui/text-field";
import { useCart } from "@/hooks/useCart";
import { useCheckout } from "@/hooks/useCheckout";
import { analyticsService } from "@/lib/analytics";
import { defaultShippingConfig } from "@/lib/shipping-config";
import { formatCurrency } from "@/lib/utils";
import {
  checkoutInformationSchema,
  type CheckoutInformationInput,
} from "@/lib/validations/checkout";
import { createOrderAction } from "@/server/actions/checkout";
import { useCartStore } from "@/store/cart-store";

interface CheckoutWizardProps {
  providers: { id: string; label: string }[];
}

type FormValues = CheckoutInformationInput & { providerId: string };

const informationFields = [
  "firstName",
  "lastName",
  "email",
  "phone",
  "line1",
  "line2",
  "city",
  "region",
  "postalCode",
  "country",
  "researchAcknowledged",
] as const satisfies readonly (keyof FormValues)[];

/**
 * 2-step wizard (Information → Review) extending the existing useCheckout
 * hook. A single react-hook-form instance backs both steps; "Continue"
 * validates only the Information fields via form.trigger(names), "Place
 * Order" validates everything (including payment method) before calling the
 * createOrderAction Server Action.
 */
export function CheckoutWizard({ providers }: CheckoutWizardProps) {
  const router = useRouter();
  const { lines, subtotal } = useCart();
  const { step, setStep } = useCheckout();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const shippingCost =
    subtotal >= defaultShippingConfig.freeThreshold ? 0 : defaultShippingConfig.flatRate;
  const total = subtotal + shippingCost;

  const form = useForm<FormValues>({
    resolver: zodResolver(checkoutInformationSchema.extend({ providerId: z.string().min(1) })),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      line1: "",
      line2: "",
      city: "",
      region: "",
      postalCode: "",
      country: "US",
      researchAcknowledged: false,
      providerId: providers[0]?.id ?? "",
    },
    mode: "onBlur",
  });

  const researchAcknowledged = useWatch({ control: form.control, name: "researchAcknowledged" });
  const providerId = useWatch({ control: form.control, name: "providerId" });

  useEffect(() => {
    analyticsService.track("begin_checkout");
  }, []);

  useEffect(() => {
    if (lines.length > 0) return;

    // `hasHydrated` alone isn't a reliable enough signal here: Zustand's
    // persist middleware updates `lines` and flips its hydrated flag in two
    // separate microtask ticks, so there's a real (if brief) window where
    // `hasHydrated` is already `true` but `lines` hasn't caught up yet —
    // gating on it directly caused false "empty cart" redirects on every
    // full-page visit to /checkout, even with a populated cart. Re-checking
    // the store's live state (not the render's closed-over `lines`) after a
    // short delay avoids trusting that transient snapshot.
    const timeout = setTimeout(() => {
      if (useCartStore.getState().lines.length === 0) {
        toast.error("Your cart is empty.");
        router.replace("/cart");
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [lines.length, router]);

  // A brief blank render while `lines` catches up post-hydration is fine —
  // it resolves within one re-render for a real cart; the debounced check
  // above is what actually decides whether to redirect a truly empty one.
  if (lines.length === 0) return null;

  async function handleContinue() {
    const valid = await form.trigger(informationFields);
    if (valid) setStep("review");
  }

  async function handlePlaceOrder() {
    const valid = await form.trigger();
    if (!valid) return;

    setIsSubmitting(true);
    const result = await createOrderAction(form.getValues(), lines);
    setIsSubmitting(false);

    if (!result.success || !result.orderId) {
      toast.error(result.error ?? "Something went wrong placing your order.");
      if (result.fieldErrors) {
        for (const [key, message] of Object.entries(result.fieldErrors)) {
          if (message) form.setError(key as keyof FormValues, { message });
        }
      }
      return;
    }

    // Cart stays populated through the payment step (the order isn't
    // confirmed yet) — it's cleared on the confirmation page instead, once
    // the order has actually gone through. Clearing here would empty
    // `lines` while this component is still mounted, tripping the
    // empty-cart redirect above mid-navigation.
    router.push(`/checkout/payment/${result.orderId}`);
  }

  return (
    <FormProvider {...form}>
      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-foreground-primary text-3xl tracking-wide uppercase sm:text-4xl">
          Checkout
        </h1>
        <ol
          className="flex items-center gap-2 text-xs tracking-wide uppercase"
          aria-label="Checkout steps"
        >
          <li
            aria-current={step === "address" ? "step" : undefined}
            className={step === "address" ? "text-accent-crimson" : "text-foreground-muted"}
          >
            1. Information
          </li>
          <li className="text-foreground-muted" aria-hidden="true">
            →
          </li>
          <li
            aria-current={step === "review" ? "step" : undefined}
            className={step === "review" ? "text-accent-crimson" : "text-foreground-muted"}
          >
            2. Review
          </li>
        </ol>
      </div>

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]">
        <form className="flex flex-col gap-8" onSubmit={(e) => e.preventDefault()}>
          {step === "address" ? (
            <>
              <fieldset className="flex flex-col gap-4">
                <legend className="font-heading text-foreground-primary mb-2 text-sm tracking-wide uppercase">
                  Customer Information
                </legend>
                <div className="grid gap-4 sm:grid-cols-2">
                  <TextField name="firstName" label="First Name" />
                  <TextField name="lastName" label="Last Name" />
                </div>
                <TextField name="email" label="Email" type="email" />
                <TextField name="phone" label="Phone" type="tel" />
              </fieldset>

              <fieldset className="flex flex-col gap-4">
                <legend className="font-heading text-foreground-primary mb-2 text-sm tracking-wide uppercase">
                  Shipping Address
                </legend>
                <TextField name="line1" label="Address" />
                <TextField name="line2" label="Apartment, suite, etc. (optional)" />
                <div className="grid gap-4 sm:grid-cols-3">
                  <TextField name="city" label="City" />
                  <TextField name="region" label="State / Region" />
                  <TextField name="postalCode" label="Postal Code" />
                </div>
                <TextField name="country" label="Country" />
              </fieldset>

              <Field data-invalid={!!form.formState.errors.researchAcknowledged}>
                <FieldLabel className="flex-row items-start gap-2">
                  <Checkbox
                    checked={researchAcknowledged}
                    onCheckedChange={(checked) =>
                      form.setValue("researchAcknowledged", checked === true, {
                        shouldValidate: true,
                      })
                    }
                  />
                  <FieldContent>
                    <span className="text-foreground-primary text-sm">
                      I acknowledge these products are for research use only and are not for human
                      or animal consumption.
                    </span>
                  </FieldContent>
                </FieldLabel>
                <FieldError
                  errors={
                    form.formState.errors.researchAcknowledged
                      ? [form.formState.errors.researchAcknowledged]
                      : undefined
                  }
                />
              </Field>

              <Button type="button" size="lg" className="w-fit" onClick={handleContinue}>
                Continue to Review
              </Button>
            </>
          ) : (
            <>
              <section className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h2 className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
                    Customer &amp; Shipping
                  </h2>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setStep("address")}
                  >
                    Edit
                  </Button>
                </div>
                <div className="border-border rounded-lg border p-4 text-sm">
                  <p className="text-foreground-primary">
                    {form.getValues("firstName")} {form.getValues("lastName")}
                  </p>
                  <p className="text-foreground-muted">
                    {form.getValues("email")} · {form.getValues("phone")}
                  </p>
                  <p className="text-foreground-muted mt-2">
                    {form.getValues("line1")}
                    {form.getValues("line2") ? `, ${form.getValues("line2")}` : ""}
                    <br />
                    {form.getValues("city")}, {form.getValues("region")}{" "}
                    {form.getValues("postalCode")}
                    <br />
                    {form.getValues("country")}
                  </p>
                </div>
              </section>

              <fieldset className="flex flex-col gap-3">
                <legend className="font-heading text-foreground-primary mb-2 text-sm tracking-wide uppercase">
                  Payment Method
                </legend>
                <RadioGroup
                  value={providerId}
                  onValueChange={(value) =>
                    form.setValue("providerId", value as string, { shouldValidate: true })
                  }
                >
                  {providers.map((provider) => (
                    <FieldLabel key={provider.id} className="flex-row items-center gap-2">
                      <RadioGroupItem value={provider.id} />
                      <FieldContent>
                        <span className="text-foreground-primary text-sm">{provider.label}</span>
                      </FieldContent>
                    </FieldLabel>
                  ))}
                </RadioGroup>
                <FieldError
                  errors={
                    form.formState.errors.providerId
                      ? [form.formState.errors.providerId]
                      : undefined
                  }
                />
              </fieldset>

              <Button
                type="button"
                size="lg"
                className="w-fit"
                onClick={handlePlaceOrder}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Placing Order..." : "Place Order"}
              </Button>
            </>
          )}
        </form>

        <aside className="border-border h-fit rounded-lg border p-6">
          <h2 className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
            Order Summary
          </h2>
          <div className="mt-4 flex flex-col gap-3">
            {lines.map((line) => (
              <div key={line.variantId} className="flex justify-between text-sm">
                <span className="text-foreground-muted">
                  {line.name} × {line.quantity}
                </span>
                <span className="text-foreground-primary">
                  {formatCurrency(line.price * line.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-border mt-4 flex flex-col gap-2 border-t pt-4 text-sm">
            <div className="flex justify-between">
              <span className="text-foreground-muted">Subtotal</span>
              <span className="text-foreground-primary">{formatCurrency(subtotal)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground-muted">Shipping</span>
              <span className="text-foreground-primary">
                {shippingCost === 0 ? "Free" : formatCurrency(shippingCost)}
              </span>
            </div>
            <div className="border-border mt-2 flex justify-between border-t pt-2">
              <span className="text-foreground-primary font-heading">Total</span>
              <span className="text-foreground-primary font-heading">{formatCurrency(total)}</span>
            </div>
          </div>
        </aside>
      </div>
    </FormProvider>
  );
}

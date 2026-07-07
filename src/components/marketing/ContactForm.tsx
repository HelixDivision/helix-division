"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, ChevronRight } from "lucide-react";
import Script from "next/script";
import { useRef, useState } from "react";
import { Controller, FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Field, FieldError, FieldLabel } from "@/components/ui/field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TextField } from "@/components/ui/text-field";
import { TextareaField } from "@/components/ui/textarea-field";
import { CONTACT_SUBJECTS, contactSchema, type ContactFormInput } from "@/lib/validations/contact";
import { submitContactAction } from "@/server/actions/contact";

declare global {
  interface Window {
    grecaptcha?: { getResponse: (id?: number) => string; reset: (id?: number) => void };
  }
}

/**
 * Contact form (Prototype Launch) — matches the mockup's SEND US A MESSAGE
 * panel: name + email row, subject select, message, spam check, send button.
 * Client-side zod validation mirrors the server; a hidden honeypot + optional
 * reCAPTCHA (rendered only when a site key is configured) protect against spam;
 * loading, success, and error states are all handled.
 */
export function ContactForm({ recaptchaSiteKey }: { recaptchaSiteKey?: string }) {
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);
  const recaptchaRef = useRef<HTMLDivElement>(null);

  const form = useForm<ContactFormInput>({
    resolver: zodResolver(contactSchema),
    defaultValues: { name: "", email: "", subject: undefined, message: "", company: "" },
    mode: "onBlur",
  });

  async function onSubmit(values: ContactFormInput) {
    setSubmitting(true);
    let recaptchaToken: string | undefined;
    if (recaptchaSiteKey && typeof window !== "undefined" && window.grecaptcha) {
      recaptchaToken = window.grecaptcha.getResponse();
      if (!recaptchaToken) {
        setSubmitting(false);
        toast.error("Please complete the “I'm not a robot” check.");
        return;
      }
    }

    const result = await submitContactAction({ ...values, recaptchaToken });
    setSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          if (message) form.setError(field as keyof ContactFormInput, { message });
        }
      }
      toast.error(result.error ?? "Something went wrong. Please try again.");
      if (recaptchaSiteKey) window.grecaptcha?.reset();
      return;
    }

    setSent(true);
    toast.success("Message sent — we'll be in touch.");
  }

  if (sent) {
    return (
      <div className="border-border bg-background-raised flex flex-col items-center gap-3 rounded-lg border p-10 text-center">
        <CheckCircle2 className="text-state-success size-10" strokeWidth={1.5} />
        <h3 className="font-heading text-foreground-primary text-lg tracking-wide uppercase">
          Message Sent
        </h3>
        <p className="text-foreground-muted max-w-sm text-sm">
          Thank you for reaching out. A member of our team will get back to you as soon as possible.
        </p>
        <Button variant="outline" onClick={() => setSent(false)}>
          Send another message
        </Button>
      </div>
    );
  }

  return (
    <FormProvider {...form}>
      {recaptchaSiteKey && (
        <Script src="https://www.google.com/recaptcha/api.js" strategy="afterInteractive" />
      )}
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-5" noValidate>
        <div className="grid gap-5 sm:grid-cols-2">
          <TextField name="name" label="Full Name" placeholder="Dr. Jane Researcher" />
          <TextField name="email" label="Email Address" type="email" placeholder="you@lab.com" />
        </div>

        <Controller
          control={form.control}
          name="subject"
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel>Subject</FieldLabel>
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger aria-label="Subject" aria-invalid={!!fieldState.error}>
                  <SelectValue placeholder="Choose a subject" />
                </SelectTrigger>
                <SelectContent>
                  {CONTACT_SUBJECTS.map((subject) => (
                    <SelectItem key={subject} value={subject}>
                      {subject}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError errors={fieldState.error ? [fieldState.error] : undefined} />
            </Field>
          )}
        />

        <TextareaField
          name="message"
          label="Your Message"
          rows={5}
          placeholder="How can we help with your research?"
        />

        {/* Honeypot — visually hidden, off the tab order, not autofilled by humans. */}
        <div aria-hidden className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
          <label htmlFor="company">Company (leave blank)</label>
          <input
            id="company"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            {...form.register("company")}
          />
        </div>

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          {recaptchaSiteKey ? (
            <div ref={recaptchaRef} className="g-recaptcha" data-sitekey={recaptchaSiteKey} />
          ) : (
            <p className="text-foreground-muted text-xs">Protected against spam.</p>
          )}
          <Button type="submit" size="lg" disabled={submitting}>
            {submitting ? "Sending..." : "Send Message"}
            {!submitting && (
              <ChevronRight className="transition-transform duration-250 group-hover/button:translate-x-0.5" />
            )}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
}

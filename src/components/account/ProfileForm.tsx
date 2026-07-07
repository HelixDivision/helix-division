"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/text-field";
import { profileSchema, type ProfileInput } from "@/lib/validations/account";
import { updateProfileAction } from "@/server/actions/account";

/**
 * Account profile form (Phase 8). Delegates to updateProfileAction, which
 * re-checks the session and calls server/services/user.ts. Changing the email
 * clears the verified flag server-side (see updateProfile) — surfaced to the
 * user via the note under the field.
 */
export function ProfileForm({ defaultValues }: { defaultValues: ProfileInput }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProfileInput>({
    resolver: zodResolver(profileSchema),
    defaultValues,
    mode: "onBlur",
  });

  async function onSubmit(values: ProfileInput) {
    setIsSubmitting(true);
    const result = await updateProfileAction(values);
    setIsSubmitting(false);

    if (!result.success) {
      if (result.fieldErrors) {
        for (const [field, message] of Object.entries(result.fieldErrors)) {
          if (message) form.setError(field as keyof ProfileInput, { message });
        }
      }
      toast.error(result.error ?? "Something went wrong. Please try again.");
      return;
    }

    toast.success("Profile updated.");
    router.refresh();
  }

  return (
    <FormProvider {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="flex max-w-md flex-col gap-5">
        <TextField name="name" label="Name (optional)" />
        <TextField
          name="email"
          label="Email"
          type="email"
          description="Changing your email will mark it unverified until you confirm it again."
        />
        <Button type="submit" disabled={isSubmitting} className="w-fit">
          {isSubmitting ? "Saving..." : "Save Changes"}
        </Button>
      </form>
    </FormProvider>
  );
}

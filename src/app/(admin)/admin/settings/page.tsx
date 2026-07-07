import type { Metadata } from "next";

import { ContactRecipientForm } from "@/components/admin/ContactRecipientForm";
import { getContactRecipientEmail } from "@/server/services/settings";

export const metadata: Metadata = {
  title: "Settings | Admin | Helix Division",
};

export default async function AdminSettingsPage() {
  const recipient = await getContactRecipientEmail();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h2 className="font-heading text-foreground-primary text-lg tracking-wide uppercase">
          Settings
        </h2>
        <p className="text-foreground-muted mt-1 text-sm">Site-wide configuration.</p>
      </div>

      <section className="border-border rounded-lg border p-6">
        <h3 className="font-heading text-foreground-primary text-sm tracking-wide uppercase">
          Contact
        </h3>
        <div className="mt-4">
          <ContactRecipientForm current={recipient} />
        </div>
      </section>
    </div>
  );
}

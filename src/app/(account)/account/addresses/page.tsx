import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AddressBook } from "@/components/account/AddressBook";
import { auth } from "@/lib/auth";
import { listAddresses } from "@/server/services/user";

export const metadata: Metadata = {
  title: "Addresses | Helix Division",
};

export default async function AddressesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login?callbackUrl=/account/addresses");

  const addresses = await listAddresses(session.user.id);

  return <AddressBook addresses={addresses} />;
}

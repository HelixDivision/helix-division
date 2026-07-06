import { Card, CardContent } from "@/components/ui/card";

/** Shared centered shell for login/register/forgot-password/reset-password/verify-email — the /account dashboard stub lives outside this group and uses the normal page-content wrapper instead. */
export default function AuthFormsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto flex max-w-md flex-col px-6 py-16 sm:px-8">
      <Card>
        <CardContent className="flex flex-col gap-6 py-2">{children}</CardContent>
      </Card>
    </div>
  );
}

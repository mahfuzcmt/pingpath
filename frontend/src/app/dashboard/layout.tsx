import { redirect } from "next/navigation";
import { readSession } from "@/lib/session";
import { backendBase } from "@/lib/session";
import { Topbar } from "@/components/shell/Topbar";
import { AlarmBanner } from "@/components/alarm/AlarmBanner";
import { SessionProvider } from "@/lib/session-context";
import type { AuthMeResponse } from "@/types/domain";

interface BackendUser {
  id: string;
  email: string;
  fullName: string | null;
  role: string;
  orgId: string;
}

async function loadMe(): Promise<AuthMeResponse> {
  const session = await readSession();
  if (!session) redirect("/login");

  const r = await fetch(`${backendBase()}/api/v1/auth/me`, {
    headers: { Authorization: `Bearer ${session.accessToken}` },
    cache: "no-store",
  });
  if (!r.ok) redirect("/login");
  const u = (await r.json()) as BackendUser;

  return {
    user: {
      id: u.id,
      email: u.email,
      fullName: u.fullName,
      role: u.role as AuthMeResponse["user"]["role"],
      locale: "en",
    },
    org: {
      id: session.orgId,
      name: "—",
      plan: "—",
      locale: "en",
    },
  };
}

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const me = await loadMe();

  return (
    <SessionProvider
      value={{
        userId: me.user.id,
        orgId: me.org.id,
        email: me.user.email,
        role: me.user.role,
      }}
    >
      <div className="flex h-screen w-screen flex-col overflow-hidden bg-surface-100 text-ink-900">
        <Topbar user={me.user} orgId={me.org.id} />
        <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
        <AlarmBanner />
      </div>
    </SessionProvider>
  );
}

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "MotoLink GPS — Vehicle Tracking in Bangladesh",
  description:
    "Real-time GPS vehicle tracking for Bangladesh: live map, route replay, geofence alerts, remote engine lock, and fleet reports. Bengali-first dashboard and mobile app.",
};

export default async function RootPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get(process.env.SESSION_COOKIE_NAME ?? "pp_session");
  if (session?.value) redirect("/dashboard");
  return <LandingPage />;
}

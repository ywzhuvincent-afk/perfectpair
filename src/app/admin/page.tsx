import type { Metadata } from "next";
import { AdminConsole } from "@/components/admin-console";

export const metadata: Metadata = {
  title: "PerfectPair Operations",
  robots: { index: false, follow: false },
};

export default function AdminPage() {
  return <AdminConsole />;
}

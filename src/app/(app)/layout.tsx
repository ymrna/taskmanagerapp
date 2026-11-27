import { Suspense } from "react";
import { requireUser } from "@/lib/auth";
import { Sidebar, SidebarSkeleton } from "./sidebar";

async function SidebarLoader() {
  const user = await requireUser();
  return <Sidebar user={{ name: user.name, role: user.role }} />;
}

export default function AppLayout({ children }: LayoutProps<"/">) {
  return (
    <div className="min-h-full transition-[padding] lg:pl-64 lg:sidebar-hidden:pl-0">
      <Suspense fallback={<SidebarSkeleton />}>
        <SidebarLoader />
      </Suspense>
      <main className="mx-auto w-full max-w-[1600px] px-3 py-5 sm:px-6 lg:py-7">{children}</main>
    </div>
  );
}

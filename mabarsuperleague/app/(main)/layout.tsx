import { SiteFooter } from "@/components/shared/site-footer";
import { SiteHeader } from "@/components/shared/site-header";

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-[#0A0B0D] font-body text-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-[1240px] flex-1 px-6 pb-[70px] pt-9 sm:px-10">
        {children}
      </main>
      <SiteFooter />
    </div>
  );
}

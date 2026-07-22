export function SiteFooter() {
  return (
    <footer className="border-t border-white/[0.08]">
      <div className="mx-auto w-full max-w-[1240px] px-6 py-6 text-center text-sm font-semibold text-white/35 sm:px-10">
        © {new Date().getFullYear()} Mabar Super League. All rights reserved.
      </div>
    </footer>
  );
}

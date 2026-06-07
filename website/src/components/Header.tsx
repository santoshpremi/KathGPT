import { Logo } from "./Logo";

const links = [
  { href: "#tech", label: "Rust" },
  { href: "#features", label: "Features" },
  { href: "#download", label: "Download" },
  { href: "#faq", label: "FAQ" },
];

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 border-b border-white/5 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Logo />
        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-slate-400 transition hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>
        <a
          href="#download"
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-600/25 transition hover:bg-indigo-500"
        >
          Download
        </a>
      </div>
    </header>
  );
}

import { SITE } from "../lib/site";
import { Logo } from "./Logo";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-stone-200 bg-white py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <Logo />
        <nav className="flex flex-wrap justify-center gap-6 text-sm text-stone-500">
          <a href="#product" className="hover:text-stone-900">
            Product
          </a>
          <a href="#tech" className="hover:text-stone-900">
            Rust
          </a>
          <a href="#features" className="hover:text-stone-900">
            Features
          </a>
          <a href="#download" className="hover:text-stone-900">
            Download
          </a>
          <a
            href={`https://github.com/${SITE.githubRepo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-stone-900"
          >
            GitHub
          </a>
          <a
            href={`https://github.com/${SITE.githubRepo}/blob/main/LICENSE`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-stone-900"
          >
            License
          </a>
        </nav>
        <p className="text-sm text-stone-500">
          © {year} {SITE.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

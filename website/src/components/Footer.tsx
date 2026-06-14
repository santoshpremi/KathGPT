import { SITE } from "../lib/site";
import { Logo } from "./Logo";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-stone-900 bg-black py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-6 px-6 md:flex-row">
        <Logo />
        <nav className="flex flex-wrap justify-center gap-6 text-sm text-stone-500">
          <a href="#product" className="hover:text-white">
            Product
          </a>
          <a href="#install-setup" className="hover:text-white">
            Install Setup
          </a>
          <a href="#tech" className="hover:text-white">
            Rust
          </a>
          <a href="#features" className="hover:text-white">
            Features
          </a>
          <a href="#download" className="hover:text-white">
            Download
          </a>
          <a
            href={`https://github.com/${SITE.githubRepo}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white"
          >
            GitHub
          </a>
          <a
            href={`https://github.com/${SITE.githubRepo}/blob/main/LICENSE`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-white"
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

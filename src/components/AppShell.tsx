"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bookmark, Compass, Menu, Moon, Newspaper, Sun, X } from "lucide-react";
import { EDITION_STORIES } from "@/lib/content";
import { useSavedWords, useTheme } from "@/lib/useLocalPrefs";

function BrandMark() {
  return <span className="brand-mark" aria-hidden="true"><span /></span>;
}

export default function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileNav, setMobileNav] = useState(false);
  const [saved] = useSavedWords();
  const [theme, toggleTheme] = useTheme();

  useEffect(() => setMobileNav(false), [pathname]);

  const navItems = [
    { href: "/", title: "Today's edition", icon: Newspaper, count: String(EDITION_STORIES.length).padStart(2, "0"), active: pathname === "/" || pathname.startsWith("/news/") },
    { href: "/archive/", title: "Story archive", icon: Compass, active: pathname.startsWith("/archive") },
    { href: "/vocabulary/", title: "My words", icon: Bookmark, count: saved.length ? String(saved.length).padStart(2, "0") : undefined, active: pathname.startsWith("/vocabulary") },
  ];

  return <div className="app-shell">
    <aside className={`sidebar${mobileNav ? " sidebar-open" : ""}`}>
      <div className="sidebar-top">
        <Link className="brand-lockup" href="/" aria-label="NewsLingo home"><BrandMark /><span>newslingo<span className="brand-period">.</span></span></Link>
        <button className="mobile-menu-close icon-button" aria-label="Close menu" onClick={() => setMobileNav(false)}><X size={18} /></button>
      </div>
      <div className="sidebar-caption">YOUR READING DESK</div>
      <nav className="main-nav" aria-label="Main navigation">
        {navItems.map(({ href, title, icon: Icon, count, active }) => <Link className={`nav-item${active ? " nav-active" : ""}`} key={href} href={href}><Icon size={17} strokeWidth={active ? 2.2 : 1.8} /><span>{title}</span>{count && <span className="nav-count">{count}</span>}</Link>)}
      </nav>
      <div className="sidebar-spacer" />
      <button className="theme-toggle" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>{theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}<span>{theme === "dark" ? "Light mode" : "Dark mode"}</span></button>
      <div className="sidebar-bottom"><span lang="he" dir="rtl">עברית</span><span>·</span><span>English</span></div>
    </aside>

    {mobileNav && <button className="mobile-nav-scrim" aria-label="Close menu" onClick={() => setMobileNav(false)} />}

    <div className="main-column">
      <header className="topbar">
        <button className="mobile-menu icon-button" aria-label="Open navigation" onClick={() => setMobileNav(true)}><Menu size={20} /></button>
        <Link className="topbar-brand" href="/"><BrandMark /><span>newslingo</span></Link>
        <button className="theme-toggle theme-toggle-mobile icon-button" onClick={toggleTheme} aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}>{theme === "dark" ? <Sun size={17} /> : <Moon size={17} />}</button>
      </header>
      {children}
      <nav className="mobile-tabbar" aria-label="Mobile navigation">{navItems.map(({ href, title, icon: Icon, active }) => <Link key={href} href={href} className={active ? "mobile-tab-active" : ""}><Icon size={19} /><span>{title === "Today's edition" ? "Today" : title === "Story archive" ? "Archive" : "My words"}</span></Link>)}</nav>
    </div>
  </div>;
}

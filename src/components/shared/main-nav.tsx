"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { usePathname } from "next/navigation";

export function MainNav() {
  const pathname = usePathname();

  const links = [
    { href: "/accounts", label: "Accounts" },
    { href: "/transactions", label: "Transactions" },
    { href: "/budget", label: "Budget" },
    // { href: "/analysis", label: "Analysis" },
  ];

  return (
    <nav className="flex items-center space-x-6">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === link.href ? "text-foreground" : "text-muted-foreground"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}

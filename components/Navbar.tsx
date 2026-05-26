"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  const pathname = usePathname();
  const supabase = createClient();

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  const displayName = user?.user_metadata?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "User";

  return (
    <nav className="border-b-2 border-black px-4 sm:px-8 py-4 flex justify-between items-center">
      <Link href="/" className="font-mono text-xs uppercase tracking-widest">
        ConnectCS
      </Link>

      <div className="flex gap-6 items-center">
        {user ? (
          <>
            <NavLink href="/" active={pathname === "/"}>Browse</NavLink>
            <NavLink href="/profile" active={pathname === "/profile"}>{displayName}</NavLink>
            <button
              onClick={handleSignOut}
              className="font-mono text-xs uppercase opacity-40 hover:opacity-100 transition-opacity"
            >
              Sign Out
            </button>
          </>
        ) : (
          <div className="flex gap-3 items-center">
            <Link
              href="/auth/login"
              className="font-mono text-xs uppercase border border-black px-3 py-1 hover:bg-black hover:text-white transition-colors"
            >
              Sign In
            </Link>
            <Link
              href="/auth/sign-up"
              className="font-mono text-xs uppercase bg-black text-white border border-black px-3 py-1 hover:bg-black/80 transition-colors"
            >
              Sign Up
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}

function NavLink({
  href,
  active,
  children,
}: {
  href: string;
  active: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`font-mono text-xs uppercase transition-opacity ${
        active ? "opacity-100" : "opacity-40 hover:opacity-100"
      }`}
    >
      {children}
    </Link>
  );
}
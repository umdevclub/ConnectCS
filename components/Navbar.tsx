// components/Navbar.tsx
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Navbar({ user }: { user: User | null }) {
  const pathname = usePathname();
  const supabase = createClient();

  async function handleSignIn() {
    const email = prompt("Enter your email:");
    if (!email) return;
    await supabase.auth.signInWithOtp({ email });
    alert("Check your email for a magic link.");
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    window.location.href = "/";
  }

  return (
    <nav className="border-b-2 border-black px-4 sm:px-8 py-4 flex justify-between items-center">
      <Link href="/" className="font-mono text-xs uppercase tracking-widest">
        ConnectCS
      </Link>

      <div className="flex gap-6 items-center">
        {user ? (
          <>
            <NavLink href="/" active={pathname === "/"}>Browse</NavLink>
            <NavLink href="/profile" active={pathname === "/profile"}>Profile</NavLink>
            <button
              onClick={handleSignOut}
              className="font-mono text-xs uppercase opacity-40 hover:opacity-100 transition-opacity"
            >
              Sign Out
            </button>
          </>
        ) : (
          <button
            onClick={handleSignIn}
            className="font-mono text-xs uppercase border border-black px-3 py-1 hover:bg-black hover:text-white transition-colors"
          >
            Sign In
          </button>
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
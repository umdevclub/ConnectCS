"use client";

import Link from "next/link";
import type { User } from "@supabase/supabase-js";
import { Button } from "@/components/ui/button";
import { LogoutButton } from "@/components/logout-button";

interface NavbarProps {
  user: User | null;
}

export default function Navbar({ user }: NavbarProps) {
  return (
    <nav className="w-full flex justify-center border-b border-b-black/10 h-16">
      <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
        <Link href="/" className="font-semibold">
          ConnectCS
        </Link>
        {user ? (
          <div className="flex items-center gap-4">
            <span className="text-xs">Hey, {user.email}!</span>
            <LogoutButton />
          </div>
        ) : (
          <div className="flex gap-2">
            <Button asChild size="sm" variant="outline">
              <Link href="/auth/login">Sign in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/auth/sign-up">Sign up</Link>
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}

// app/page.tsx
"use client";

import { useState, useEffect, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import ProfileCard from "@/components/ProfileCard";
import { Search } from "lucide-react";
import type { ProfileDTO } from "@/lib/dto/profile";
import type { User } from "@supabase/supabase-js";

const supabase = createClient();
const SESSION_KEY = "connectcs-profile-order";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function applyStoredOrder(source: ProfileDTO[]): ProfileDTO[] {
  const stored = sessionStorage.getItem(SESSION_KEY);

  if (stored) {
    const order: string[] = JSON.parse(stored);
    const known = [...source].sort(
      (a, b) => order.indexOf(a.userId) - order.indexOf(b.userId)
    );
    // Any new profiles not in the stored order get appended at the end
    const newProfiles = source.filter((p) => !order.includes(p.userId));
    if (newProfiles.length > 0) {
      const updated = [...order, ...newProfiles.map((p) => p.userId)];
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(updated));
    }
    return [...known, ...newProfiles];
  }

  const shuffled = shuffle(source);
  sessionStorage.setItem(
    SESSION_KEY,
    JSON.stringify(shuffled.map((p) => p.userId))
  );
  return shuffled;
}

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<ProfileDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    async function fetchProfiles() {
      setLoading(true);

      // SUPABASE CALL 3: fetch all profiles for the grid
      const { data, error } = await supabase.from("profiles").select("*");
      const source: ProfileDTO[] = error ? [] : (data as ProfileDTO[]);
      setProfiles(applyStoredOrder(source));
      setLoading(false);
    }

    fetchProfiles();
  }, []);

  const filtered = useMemo(() => {
    if (!query.trim()) return profiles;
    return profiles.filter((p) =>
      p.name?.toLowerCase().includes(query.toLowerCase())
    );
  }, [profiles, query]);

  return (
    <main className="min-h-screen bg-white">
      <Navbar user={user} />

      <div className="p-4 sm:p-8 space-y-6">
        <div className="flex items-center border-2 border-black px-3 py-2 gap-2">
          <Search size={14} className="opacity-30 shrink-0" />
          <input
            className="flex-1 text-sm outline-none bg-transparent font-mono uppercase placeholder:opacity-30 placeholder:normal-case placeholder:font-sans"
            placeholder="Search by name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="opacity-30 hover:opacity-100 transition-opacity font-mono text-xs"
            >
              ✕
            </button>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="border-2 border-black h-48 animate-pulse bg-black/5"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <p className="font-mono text-xs uppercase opacity-30 text-center pt-8">
            {query ? "No profiles match." : "No profiles yet."}
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {filtered.map((profile) => (
              <ProfileCard key={profile.userId} profile={profile} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
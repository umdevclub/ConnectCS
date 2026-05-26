"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { User } from "@supabase/supabase-js";

import Navbar from "@/components/Navbar";
import ProfileCard from "@/components/ProfileCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ProfileDTO } from "@/lib/dto/profile";
import { createClient } from "@/lib/supabase/client";

type ProfileWithId = ProfileDTO & { id: string };

export default function Home() {
  const [supabase] = useState(() => createClient());
  const [user, setUser] = useState<User | null>(null);
  const [profiles, setProfiles] = useState<ProfileWithId[]>([]);
  const [search, setSearch] = useState("");
  const [loadingProfiles, setLoadingProfiles] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

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
  }, [supabase]);

  useEffect(() => {
    let active = true;

    async function loadProfiles() {
      setLoadingProfiles(true);
      setErrorMessage(null);

      try {
        const response = await fetch("/api/v1/profiles");
        if (!active) return;

        if (!response.ok) {
          setErrorMessage("Failed to load profiles.");
          return;
        }

        const data = (await response.json()) as ProfileDTO[];
        const normalized = data.filter(
          (profile): profile is ProfileWithId => Boolean(profile.id),
        );
        setProfiles(normalized);
      } catch {
        if (active) {
          setErrorMessage("Failed to load profiles.");
        }
      } finally {
        if (active) {
          setLoadingProfiles(false);
        }
      }
    }

    loadProfiles();

    return () => {
      active = false;
    };
  }, []);

  const filteredProfiles = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) {
      return profiles;
    }

    return profiles.filter((profile) => {
      const experienceText = (profile.experiences ?? [])
        .map((exp) => [exp.company, exp.role].filter(Boolean).join(" "))
        .filter(Boolean)
        .join(" ");
      const haystack = [
        profile.name,
        profile.start_term,
        profile.grad_year,
        experienceText,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [profiles, search]);

  const profileCountLabel = loadingProfiles
    ? "Loading profiles..."
    : `${filteredProfiles.length} profile${filteredProfiles.length === 1 ? "" : "s"}`;

  return (
    <main className="min-h-screen bg-background">
      <Navbar user={user} />

      <section className="mx-auto flex w-full max-w-5xl flex-col gap-6 p-4 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="space-y-2">
            <p className="font-mono text-[10px] uppercase opacity-40">
              ConnectCS directory
            </p>
            <h1 className="text-3xl font-bold uppercase tracking-tight">
              Student Profiles
            </h1>
            <p className="text-sm text-foreground/60">
              Browse classmates, internships, and project experience.
            </p>
          </div>

          {user && (
            <Button asChild size="sm" variant="outline">
              <Link href="/profile">Manage your profile</Link>
            </Button>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div className="w-full sm:max-w-md">
            <Label
              htmlFor="profile-search"
              className="font-mono text-[10px] uppercase opacity-40"
            >
              Search profiles
            </Label>
            <Input
              id="profile-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search by name, company, or role"
            />
          </div>
          <p className="font-mono text-[10px] uppercase opacity-40">
            {profileCountLabel}
          </p>
        </div>

        {errorMessage && (
          <p className="font-mono text-[10px] uppercase text-red-600">
            {errorMessage}
          </p>
        )}

        {loadingProfiles ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="font-mono text-xs uppercase opacity-30">
              Loading profiles...
            </p>
          </div>
        ) : filteredProfiles.length === 0 ? (
          <div className="flex min-h-[40vh] items-center justify-center">
            <p className="font-mono text-xs uppercase opacity-30">
              No profiles match your search
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredProfiles.map((profile) => (
              <ProfileCard key={profile.id} profile={profile} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

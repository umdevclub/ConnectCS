// app/profile/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import Navbar from "@/components/Navbar";
import ProfileCard from "@/components/ProfileCard";
import EditProfileModal from "@/components/EditProfileModal";
import { createClient } from "@/lib/supabase/client";
import { ProfileDTO } from "@/lib/dto/profile";
import { User } from "@supabase/supabase-js";

const EMPTY_PROFILE: ProfileDTO = {
  name: "",
  start_term: "",
  grad_year: "",
  linkedin: "",
  github: "",
  experiences: [],
};

export default function ProfilePage() {
  const supabase = useMemo(() => createClient(), []);
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileDTO>(EMPTY_PROFILE);
  const [modalOpen, setModalOpen] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, [supabase]);

  useEffect(() => {
    let active = true;

    async function loadProfile() {
      if (!user) {
        setProfile(EMPTY_PROFILE);
        setLoadingProfile(false);
        return;
      }

      setLoadingProfile(true);
      setErrorMessage(null);

      try {
        const response = await fetch(`/api/v1/profiles/${user.id}`);
        if (!active) return;

        if (response.status === 404) {
          setProfile(EMPTY_PROFILE);
          return;
        }

        if (!response.ok) {
          setErrorMessage("Failed to load profile.");
          return;
        }

        const data = (await response.json()) as ProfileDTO;
        setProfile({
          ...EMPTY_PROFILE,
          ...data,
          id: data.id ?? user.id,
          experiences: data.experiences ?? [],
        });
      } catch {
        if (active) {
          setErrorMessage("Failed to load profile.");
        }
      } finally {
        if (active) {
          setLoadingProfile(false);
        }
      }
    }

    loadProfile();

    return () => {
      active = false;
    };
  }, [user]);

  async function handleSave(data: ProfileDTO) {
    if (!user) return;

    const name = data.name.trim();
    const startTerm = data.start_term.trim();

    if (!name || !startTerm) {
      setErrorMessage("Name and start term are required.");
      return;
    }

    setSavingProfile(true);
    setErrorMessage(null);

    const payload: ProfileDTO = {
      ...data,
      name,
      start_term: startTerm,
      grad_year: data.grad_year?.trim() || undefined,
      linkedin: data.linkedin?.trim() || undefined,
      github: data.github?.trim() || undefined,
      experiences: data.experiences ?? [],
    };

    const method = profile.id ? "PUT" : "POST";
    const url = profile.id ? `/api/v1/profiles/${user.id}` : "/api/v1/profiles";

    try {
      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const { error } = (await response.json()) as { error?: string };
        setErrorMessage(error ?? "Failed to save profile.");
        return;
      }

      const saved = (await response.json()) as ProfileDTO;
      setProfile({
        ...EMPTY_PROFILE,
        ...saved,
        id: saved.id ?? user.id,
        experiences: saved.experiences ?? [],
      });
    } catch {
      setErrorMessage("Failed to save profile.");
    } finally {
      setSavingProfile(false);
    }
  }

  const hasProfile = Boolean(profile.id);

  return (
    <main className="min-h-screen bg-white">
      <Navbar user={user} />

      <div className="p-4 sm:p-8">
        {!user ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <p className="font-mono text-xs uppercase opacity-30">
              Sign in to create your profile
            </p>
          </div>
        ) : loadingProfile ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <p className="font-mono text-xs uppercase opacity-30">
              Loading profile...
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            {errorMessage && (
              <p className="font-mono text-[10px] uppercase text-red-600">
                {errorMessage}
              </p>
            )}
            <div className="flex items-center justify-between">
              <p className="font-mono text-[10px] uppercase opacity-40">Your Card</p>
              {!hasProfile && (
                <button
                  onClick={() => setModalOpen(true)}
                  className="font-mono text-xs uppercase border-2 border-black px-3 py-1 hover:bg-black hover:text-white transition-colors"
                >
                  Create Profile
                </button>
              )}
            </div>

            <div className="w-full sm:w-72">
              <ProfileCard
                profile={profile}
                editable={hasProfile}
                onEdit={() => setModalOpen(true)}
              />
            </div>

            {savingProfile && (
              <p className="font-mono text-[10px] uppercase opacity-40">
                Saving profile...
              </p>
            )}
          </div>
        )}
      </div>

      {modalOpen && (
        <EditProfileModal
          initial={profile}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </main>
  );
}
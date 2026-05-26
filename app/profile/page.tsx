// app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import Navbar from "@/components/Navbar";
import ProfileCard from "@/components/ProfileCard";
import EditProfileModal from "@/components/EditProfileModal";
import type { ProfileDTO } from "@/lib/dto/profile";
import type { User } from "@supabase/supabase-js";

const supabase = createClient();

function emptyProfile(userId: string): ProfileDTO {
  return {
    userId,
    name: "",
    startTerm: ["Fall", new Date().getFullYear()],
    endTerm: null,
    contact: [],
    experience: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileDTO | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

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
    if (!user) {
      setLoading(false);
      return;
    }

    async function fetchProfile() {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("userId", user!.id)
        .single();

      if (!error && data) setProfile(data as ProfileDTO);
      setLoading(false);
    }

    fetchProfile();
  }, [user]);

  async function handleSave(data: ProfileDTO) {
    const { error } = await supabase.from("profiles").upsert(data);
    if (!error) setProfile(data);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar user={null} />
        <div className="flex items-center justify-center min-h-[80vh]">
          <div className="w-72 border-2 border-black h-64 animate-pulse bg-black/5" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="min-h-screen bg-white">
        <Navbar user={null} />
        <div className="flex items-center justify-center min-h-[80vh]">
          <p className="font-mono text-xs uppercase opacity-30">
            Sign in to view your profile
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Navbar user={user} />

      <div className="flex flex-col items-center justify-center min-h-[80vh] p-4">
        <div className="w-full max-w-sm space-y-4">
          <p className="font-mono text-[10px] uppercase opacity-40">Your Card</p>

          <ProfileCard
            profile={profile ?? emptyProfile(user.id)}
            editable={!!profile}
            onEdit={() => setModalOpen(true)}
          />

          {!profile && (
            <button
              onClick={() => setModalOpen(true)}
              className="w-full border-2 border-black py-2 font-bold uppercase text-sm hover:bg-black hover:text-white transition-colors font-mono"
            >
              Create Profile
            </button>
          )}
        </div>
      </div>

      {modalOpen && (
        <EditProfileModal
          initial={profile ?? emptyProfile(user.id)}
          onSave={handleSave}
          onClose={() => setModalOpen(false)}
        />
      )}
    </main>
  );
}
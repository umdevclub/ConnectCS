// app/profile/page.tsx
"use client";

import { useState, useEffect } from "react";
import Navbar from "@/components/Navbar";
import ProfileCard from "@/components/ProfileCard";
import EditProfileModal from "@/components/EditProfileModal";
import { supabase } from "@/lib/supabase";
import { ProfileDTO } from "@/lib/dto/profile";
import { User } from "@supabase/supabase-js";

const EMPTY_PROFILE: ProfileDTO = {
  name: "",
  grad_year: "",
  linkedin: "",
  github: "",
  experiences: [],
};

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<ProfileDTO>(EMPTY_PROFILE);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  function handleSave(data: ProfileDTO) {
    setProfile(data);
    // TODO: supabase upsert
  }

  const hasProfile = !!profile.name;

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
        ) : (
          <div className="space-y-6">
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
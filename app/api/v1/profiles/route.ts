import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { unstable_cache, revalidateTag } from "next/cache";
import { createAnonClient, buildContacts } from "@/lib/api/helpers";
import type { ProfileDTO } from "@/lib/dto/profile";

const getCachedProfiles = unstable_cache(
  async (): Promise<ProfileDTO[]> => {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `id, name, start_term, end_term, created_at,
         experience (company, type),
         contacts (contact_type, contact)`,
      );

    if (error) throw error;

    return (data ?? []).map((profile) => ({
      id: profile.id,
      name: profile.name,
      start_term: profile.start_term,
      grad_year: profile.end_term ?? undefined,
      linkedin:
        (profile.contacts as { contact_type: string; contact: string }[])?.find(
          (c) => c.contact_type === "LinkedIn",
        )?.contact ?? undefined,
      github:
        (profile.contacts as { contact_type: string; contact: string }[])?.find(
          (c) => c.contact_type === "GitHub",
        )?.contact ?? undefined,
      experiences: (
        profile.experience as { company: string; type: string }[]
      )?.map((e) => ({ company: e.company, role: e.type })) ?? [],
    }));
  },
  ["profiles-all"],
  { tags: ["profiles"], revalidate: 300 },
);

// GET /api/v1/profiles — public, cached
export async function GET() {
  try {
    const profiles = await getCachedProfiles();
    return NextResponse.json(profiles);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch profiles" },
      { status: 502 },
    );
  }
}

// POST /api/v1/profiles — authenticated
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: ProfileDTO;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!body.name || !body.start_term) {
    return NextResponse.json(
      { error: "name and start_term are required" },
      { status: 400 },
    );
  }

  // Check if profile already exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json(
      { error: "Profile already exists" },
      { status: 409 },
    );
  }

  // Insert profile
  const { error: profileError } = await supabase.from("profiles").insert({
    id: user.id,
    name: body.name,
    start_term: body.start_term,
    end_term: body.grad_year ?? null,
  });

  if (profileError) {
    return NextResponse.json(
      { error: "Failed to create profile" },
      { status: 502 },
    );
  }

  // Ensure all referenced companies exist, then insert experiences
  if (body.experiences && body.experiences.length > 0) {
    const uniqueCompanies = [
      ...new Set(body.experiences.map((e) => e.company).filter(Boolean)),
    ];
    if (uniqueCompanies.length > 0) {
      await supabase
        .from("companies")
        .upsert(
          uniqueCompanies.map((name) => ({ name })),
          { onConflict: "name" },
        );
    }

    const { error: expError } = await supabase.from("experience").insert(
      body.experiences.map((e) => ({
        profile: user.id,
        company: e.company,
        type: e.role,
      })),
    );

    if (expError) {
      return NextResponse.json(
        { error: "Failed to create experiences" },
        { status: 502 },
      );
    }
  }

  // Insert contacts
  const contacts = buildContacts(user.id, body);
  if (contacts.length > 0) {
    await supabase.from("contacts").insert(contacts);
  }

  revalidateTag("profiles", "default");

  return NextResponse.json(
    {
      id: user.id,
      name: body.name,
      start_term: body.start_term,
      grad_year: body.grad_year ?? undefined,
      linkedin: body.linkedin ?? undefined,
      github: body.github ?? undefined,
      experiences: body.experiences ?? [],
    } satisfies ProfileDTO,
    { status: 201 },
  );
}

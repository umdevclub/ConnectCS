import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { unstable_cache, revalidateTag } from "next/cache";
import { createAnonClient, buildContacts } from "@/lib/api/helpers";
import type { ProfileDTO } from "@/lib/dto/profile";

async function fetchProfile(id: string): Promise<ProfileDTO | null> {
  const supabase = createAnonClient();
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `id, name, start_term, end_term, created_at,
       experience (company, type),
       contacts (contact_type, contact)`,
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    name: data.name,
    start_term: data.start_term,
    grad_year: data.end_term ?? undefined,
    linkedin:
      (data.contacts as { contact_type: string; contact: string }[])?.find(
        (c) => c.contact_type === "LinkedIn",
      )?.contact ?? undefined,
    github:
      (data.contacts as { contact_type: string; contact: string }[])?.find(
        (c) => c.contact_type === "GitHub",
      )?.contact ?? undefined,
    experiences: (
      data.experience as { company: string; type: string }[]
    )?.map((e) => ({ company: e.company, role: e.type })) ?? [],
  };
}

function getCachedProfile(id: string): Promise<ProfileDTO | null> {
  return unstable_cache(() => fetchProfile(id), [`profile-${id}`], {
    tags: [`profile-${id}`, "profiles"],
    revalidate: 300,
  })();
}

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/v1/profiles/:id — public, cached
export async function GET(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  try {
    const profile = await getCachedProfile(id);
    if (!profile) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }
    return NextResponse.json(profile);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch profile" },
      { status: 502 },
    );
  }
}

// PUT /api/v1/profiles/:id — authenticated, owner only
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
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

  // Verify the profile exists
  const { data: existing } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", id)
    .maybeSingle();

  if (!existing) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Update profile fields
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      name: body.name,
      start_term: body.start_term,
      end_term: body.grad_year ?? null,
    })
    .eq("id", id);

  if (profileError) {
    return NextResponse.json(
      { error: "Failed to update profile" },
      { status: 502 },
    );
  }

  // Replace experiences: delete then re-insert
  const { error: deleteExpError } = await supabase
    .from("experience")
    .delete()
    .eq("profile", id);

  if (deleteExpError) {
    return NextResponse.json(
      { error: "Failed to update experiences" },
      { status: 502 },
    );
  }

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
        profile: id,
        company: e.company,
        type: e.role,
      })),
    );

    if (expError) {
      return NextResponse.json(
        { error: "Failed to update experiences" },
        { status: 502 },
      );
    }
  }

  // Replace contacts: delete then re-insert
  const { error: deleteContactsError } = await supabase
    .from("contacts")
    .delete()
    .eq("profile", id);

  if (deleteContactsError) {
    return NextResponse.json(
      { error: "Failed to update contacts" },
      { status: 502 },
    );
  }

  const contacts = buildContacts(id, body);
  if (contacts.length > 0) {
    await supabase.from("contacts").insert(contacts);
  }

  revalidateTag(`profile-${id}`, "default");
  revalidateTag("profiles", "default");

  return NextResponse.json({
    id,
    name: body.name,
    start_term: body.start_term,
    grad_year: body.grad_year ?? undefined,
    linkedin: body.linkedin ?? undefined,
    github: body.github ?? undefined,
    experiences: body.experiences ?? [],
  } satisfies ProfileDTO);
}

// DELETE /api/v1/profiles/:id — authenticated, owner only
export async function DELETE(_request: NextRequest, context: RouteContext) {
  const { id } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (user.id !== id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Profile delete cascades to experience + contacts via FK
  const { error: deleteError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", id);

  if (deleteError) {
    return NextResponse.json(
      { error: "Failed to delete profile" },
      { status: 502 },
    );
  }

  revalidateTag(`profile-${id}`, "default");
  revalidateTag("profiles", "default");

  return new NextResponse(null, { status: 204 });
}

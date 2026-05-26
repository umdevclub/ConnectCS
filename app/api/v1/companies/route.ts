import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { unstable_cache, revalidateTag } from "next/cache";
import { createAnonClient } from "@/lib/api/helpers";

const getCachedCompanies = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("companies")
      .select("name")
      .order("name");

    if (error) throw error;
    return (data ?? []).map((row: { name: string }) => row.name);
  },
  ["companies-all"],
  { tags: ["companies"], revalidate: 600 },
);

// GET /api/v1/companies — public, cached
export async function GET() {
  try {
    const companies = await getCachedCompanies();
    return NextResponse.json(companies);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch companies" },
      { status: 502 },
    );
  }
}

// POST /api/v1/companies — authenticated
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const name = body.name?.trim();
  if (!name) {
    return NextResponse.json(
      { error: "name is required" },
      { status: 400 },
    );
  }

  const { error: insertError } = await supabase
    .from("companies")
    .upsert({ name }, { onConflict: "name" });

  if (insertError) {
    return NextResponse.json(
      { error: "Failed to create company" },
      { status: 502 },
    );
  }

  revalidateTag("companies", "default");

  return NextResponse.json({ name }, { status: 201 });
}

import { NextResponse } from "next/server";
import { unstable_cache } from "next/cache";
import { createAnonClient } from "@/lib/api/helpers";

// Contact types are seeded once and never change — cache indefinitely
const getCachedContactTypes = unstable_cache(
  async (): Promise<string[]> => {
    const supabase = createAnonClient();
    const { data, error } = await supabase
      .from("contact_types")
      .select("name")
      .order("name");

    if (error) throw error;
    return (data ?? []).map((row: { name: string }) => row.name);
  },
  ["contact-types-all"],
  { tags: ["contact-types"] },
);

// GET /api/v1/contact-types — public, cached indefinitely
export async function GET() {
  try {
    const types = await getCachedContactTypes();
    return NextResponse.json(types);
  } catch {
    return NextResponse.json(
      { error: "Failed to fetch contact types" },
      { status: 502 },
    );
  }
}

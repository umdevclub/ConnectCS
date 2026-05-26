// components/EditProfileModal.tsx
"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type {
  ProfileDTO,
  Term,
  TermSeason,
  Experience,
  Contact,
} from "@/lib/dto/profile";

interface Props {
  initial: ProfileDTO;
  onSave: (data: ProfileDTO) => void;
  onClose: () => void;
}

const SEASONS: TermSeason[] = ["Fall", "Winter", "Summer"];

// Flat form shape — tuples are hard to bind to inputs directly
interface FormState {
  name: string;
  startSeason: TermSeason;
  startYear: string;
  endSeason: TermSeason;
  endYear: string;
  isPresent: boolean;
  linkedin: string;
  github: string;
  experiences: { company: string; role: string }[];
}

function profileToForm(p: ProfileDTO): FormState {
  const linkedin = p.contact.find(([t]) => t === "LinkedIn")?.[1] ?? "";
  const github = p.contact.find(([t]) => t === "GitHub")?.[1] ?? "";
  return {
    name: p.name ?? "",
    startSeason: p.startTerm[0],
    startYear: String(p.startTerm[1]),
    endSeason: p.endTerm?.[0] ?? "Fall",
    endYear: p.endTerm ? String(p.endTerm[1]) : "",
    isPresent: !p.endTerm,
    linkedin,
    github,
    experiences: p.experience.map((exp) => ({
      company: exp[2],
      role: exp[1],
    })),
  };
}

function formToProfile(form: FormState, original: ProfileDTO): ProfileDTO {
  const contact: Contact[] = [];
  if (form.linkedin) contact.push(["LinkedIn", form.linkedin]);
  if (form.github) contact.push(["GitHub", form.github]);

  const experience: Experience[] = form.experiences.map(({ company, role }) => [
    "Other", 
    role,       
    company,
    new Date(),     
    null,           
  ]);

  const startTerm: Term = [form.startSeason, Number(form.startYear)];
  const endTerm: Term | null = form.isPresent
    ? null
    : [form.endSeason, Number(form.endYear)];

  return {
    ...original,
    name: form.name,
    startTerm,
    endTerm,
    contact,
    experience,
    updatedAt: new Date(),
  };
}

export default function EditProfileModal({ initial, onSave, onClose }: Props) {
  const [form, setForm] = useState<FormState>(() => profileToForm(initial));
  const [companies, setCompanies] = useState<string[]>([]);
  const [companyQuery, setCompanyQuery] = useState("");
  const [expRole, setExpRole] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    async function fetchCompanies() {
      const { data } = await supabase.from("companies").select("name");
      setCompanies(data?.map((c: { name: string }) => c.name) ?? []);
    }
    fetchCompanies();
  }, []);

  function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  const suggestions =
    companyQuery.length > 0
      ? companies.filter((c) =>
          c.toLowerCase().includes(companyQuery.toLowerCase())
        )
      : [];

  const canCreate =
    companyQuery.length > 0 &&
    !companies.some((c) => c.toLowerCase() === companyQuery.toLowerCase());

  function selectCompany(name: string) {
    setCompanyQuery(name);
    setShowSuggestions(false);
  }

  async function addExperience() {
    if (!companyQuery.trim()) return;

    // SUPABASE CALL 5: register new company if it doesn't exist yet
    if (canCreate) {
      await supabase
        .from("companies")
        .upsert({ name: companyQuery }, { onConflict: "name" });
      setCompanies((prev) => [...prev, companyQuery]);
    }

    setField("experiences", [
      ...form.experiences,
      { company: companyQuery, role: expRole },
    ]);
    setCompanyQuery("");
    setExpRole("");
  }

  function removeExperience(i: number) {
    setField(
      "experiences",
      form.experiences.filter((_, idx) => idx !== i)
    );
  }

  function handleSave() {
    const dto = formToProfile(form, initial);
    onSave(dto);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border-2 border-black w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center border-b-2 border-black px-6 py-4">
          <p className="font-mono text-xs uppercase tracking-widest">
            Edit Profile
          </p>
          <button onClick={onClose} aria-label="Close">
            <X size={16} />
          </button>
        </div>

        <div className="px-6 py-6 space-y-6">
          <div className="space-y-4">
            <p className="font-mono text-[10px] uppercase opacity-50 tracking-widest">
              Info
            </p>
            <Field
              label="Name"
              value={form.name}
              onChange={(v) => setField("name", v)}
            />
            <Field
              label="LinkedIn URL"
              value={form.linkedin}
              onChange={(v) => setField("linkedin", v)}
            />
            <Field
              label="GitHub URL"
              value={form.github}
              onChange={(v) => setField("github", v)}
            />
          </div>

          <div className="space-y-4">
            <p className="font-mono text-[10px] uppercase opacity-50 tracking-widest">
              Term
            </p>

            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase opacity-50">
                Start
              </label>
              <div className="flex gap-2">
                <select
                  className="flex-1 border border-black px-2 py-1 text-xs font-mono bg-transparent outline-none"
                  value={form.startSeason}
                  onChange={(e) =>
                    setField("startSeason", e.target.value as TermSeason)
                  }
                >
                  {SEASONS.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <input
                  className="w-20 border border-black px-2 py-1 text-xs font-mono outline-none bg-transparent"
                  placeholder="2023"
                  value={form.startYear}
                  onChange={(e) => setField("startYear", e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="font-mono text-[10px] uppercase opacity-50">
                  End
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <span className="font-mono text-[10px] uppercase opacity-50">
                    Present
                  </span>
                  <div
                    className={`w-3 h-3 border border-black flex items-center justify-center transition-colors cursor-pointer ${
                      form.isPresent ? "bg-black" : "bg-white"
                    }`}
                    onClick={() => setField("isPresent", !form.isPresent)}
                  >
                    {form.isPresent && (
                      <svg viewBox="0 0 8 8" className="w-2 h-2">
                        <path
                          d="M1 4l2 2 4-4"
                          stroke="white"
                          strokeWidth="1.5"
                          fill="none"
                        />
                      </svg>
                    )}
                  </div>
                </label>
              </div>

              {!form.isPresent && (
                <div className="flex gap-2">
                  <select
                    className="flex-1 border border-black px-2 py-1 text-xs font-mono bg-transparent outline-none"
                    value={form.endSeason}
                    onChange={(e) =>
                      setField("endSeason", e.target.value as TermSeason)
                    }
                  >
                    {SEASONS.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                  <input
                    className="w-20 border border-black px-2 py-1 text-xs font-mono outline-none bg-transparent"
                    placeholder="2027"
                    value={form.endYear}
                    onChange={(e) => setField("endYear", e.target.value)}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-3">
            <p className="font-mono text-[10px] uppercase opacity-50 tracking-widest">
              Experience
            </p>

            {form.experiences.map((exp, i) => (
              <div
                key={i}
                className="flex justify-between items-center border-l-2 border-black pl-3"
              >
                <div>
                  <p className="text-sm font-bold uppercase">{exp.company}</p>
                  <p className="text-xs opacity-70 italic">{exp.role}</p>
                </div>
                <button
                  onClick={() => removeExperience(i)}
                  className="font-mono text-[10px] uppercase opacity-40 hover:opacity-100"
                >
                  Remove
                </button>
              </div>
            ))}

            <div className="space-y-2">
              <div className="relative">
                <input
                  className="w-full border-b border-black text-sm font-bold uppercase outline-none bg-transparent py-1 placeholder:opacity-30 placeholder:font-normal placeholder:normal-case"
                  placeholder="Company"
                  value={companyQuery}
                  onChange={(e) => {
                    setCompanyQuery(e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                />
                {showSuggestions && (suggestions.length > 0 || canCreate) && (
                  <div className="absolute top-full left-0 right-0 border-2 border-black bg-white z-10">
                    {suggestions.map((c) => (
                      <button
                        key={c}
                        className="w-full text-left px-3 py-2 text-sm uppercase font-bold hover:bg-black hover:text-white"
                        onClick={() => selectCompany(c)}
                      >
                        {c}
                      </button>
                    ))}
                    {canCreate && (
                      <button
                        className="w-full text-left px-3 py-2 text-sm uppercase font-bold opacity-50 hover:opacity-100 hover:bg-black hover:text-white"
                        onClick={() => selectCompany(companyQuery)}
                      >
                        + Add "{companyQuery}"
                      </button>
                    )}
                  </div>
                )}
              </div>

              <input
                className="w-full border-b border-black text-xs outline-none bg-transparent py-1 placeholder:opacity-30"
                placeholder="Role"
                value={expRole}
                onChange={(e) => setExpRole(e.target.value)}
              />

              <button
                onClick={addExperience}
                className="font-mono text-[10px] uppercase border border-black px-3 py-1 hover:bg-black hover:text-white transition-colors"
              >
                Add Experience
              </button>
            </div>
          </div>

          <button
            onClick={handleSave}
            className="w-full border-2 border-black py-2 font-bold uppercase text-sm hover:bg-black hover:text-white transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="font-mono text-[10px] uppercase opacity-50">{label}</label>
      <input
        className="border-b border-black text-sm outline-none bg-transparent py-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
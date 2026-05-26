"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { ProfileDTO } from "@/lib/dto/profile";


interface Props {
    initial: ProfileDTO;
    onSave: (data: ProfileDTO) => Promise<boolean> | boolean;
    onClose: () => void;
}

const COMPANIES = ["Ubisoft", "Bold Commerce", "SkipTheDishes", "AAFC", "Niche"];

export default function EditProfileModal({ initial, onSave, onClose }: Props) {
    const emptyProfile: ProfileDTO = {
        id: initial?.id,
        name: "",
        start_term: "",
        grad_year: "",
        linkedin: "",
        github: "",
        experiences: [],
    };

    const [form, setForm] = useState<ProfileDTO>(initial || emptyProfile);
    const [companies, setCompanies] = useState<string[]>(COMPANIES);

    const [expInput, setExpInput] = useState({ company: "", role: "" });
    const [companyQuery, setCompanyQuery] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);

    useEffect(() => {
        let active = true;

        async function loadCompanies() {
            try {
                const response = await fetch("/api/v1/companies");
                if (!response.ok) return;
                const data = await response.json();
                if (active && Array.isArray(data)) {
                    setCompanies(data);
                }
            } catch {
                // Fallback to static list
            }
        }

        loadCompanies();

        return () => {
            active = false;
        };
    }, []);

    type EditableField = "name" | "start_term" | "grad_year" | "linkedin" | "github";

    function handleField(field: EditableField, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    const suggestions =
        companyQuery.length > 0
            ? companies.filter((c) =>
                  c.toLowerCase().includes(companyQuery.toLowerCase()),
              )
            : [];
    const canCreate =
        companyQuery.length > 0 &&
        !companies.some((c) => c.toLowerCase() === companyQuery.toLowerCase());

    function selectCompany(name: string) {
        setExpInput((prev) => ({ ...prev, company: name }));
        setCompanyQuery(name);
        setShowSuggestions(false);
    }

    function addExperience() {
        if (!expInput.company) return;
        setForm((prev) => ({
            ...prev,
            experiences: [...prev.experiences ?? [], expInput],
        }));
        setExpInput({ company: "", role: "" });
        setCompanyQuery("");
    }

    function removeExperience(i: number) {
        setForm((prev) => ({
            ...prev,
            experiences: (prev.experiences ?? []).filter((_, idx) => idx !== i),
        }));
    }

    async function handleSave() {
        setSaveError(null);

        try {
            const saved = await onSave(form);
            if (saved) {
                onClose();
                return;
            }
        } catch {
            // Fall through to error state
        }

        setSaveError("Failed to save profile.");
    }

    return (
        <div
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <div
                className="bg-background border-2 border-foreground w-full max-w-md max-h-[90vh] overflow-y-auto"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center border-b-2 border-foreground px-6 py-4">
                    <p className="font-mono text-xs uppercase tracking-widest">Edit Profile</p>
                    <button onClick={onClose} aria-label="Close">
                        <X size={16} />
                    </button>
                </div>

                <div className="px-6 py-6 space-y-6">
                    <div className="space-y-4">
                        <p className="font-mono text-[10px] uppercase opacity-50 tracking-widest">Info</p>
                        <Field label="Name" value={form.name ?? ""} onChange={(v) => handleField("name", v)} />
                        <Field label="Start Term" value={form.start_term ?? ""} onChange={(v) => handleField("start_term", v)} />
                        <Field label="Grad Year" value={form.grad_year ?? ""} onChange={(v) => handleField("grad_year", v)} />
                        <Field label="LinkedIn URL" value={form.linkedin ?? ""} onChange={(v) => handleField("linkedin", v)} />
                        <Field label="GitHub URL" value={form.github ?? ""} onChange={(v) => handleField("github", v)} />
                    </div>

                    <div className="space-y-3">
                        <p className="font-mono text-[10px] uppercase opacity-50 tracking-widest">Experience</p>
                        {(form.experiences ?? []).map((exp, i) => (
                            <div key={i} className="flex justify-between items-center border-l-2 border-foreground pl-3">
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
                                    className="w-full border-b border-foreground text-sm font-bold uppercase outline-none bg-transparent py-1 placeholder:opacity-30 placeholder:font-normal placeholder:normal-case"
                                    placeholder="Company"
                                    value={companyQuery}
                                    onChange={(e) => {
                                        setCompanyQuery(e.target.value);
                                        setExpInput((p) => ({ ...p, company: e.target.value }));
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                />

                                {showSuggestions && (suggestions.length > 0 || canCreate) && (
                                    <div className="absolute top-full left-0 right-0 border-2 border-foreground bg-background z-10">
                                        {suggestions.map((c) => (
                                            <button
                                                key={c}
                                                className="w-full text-left px-3 py-2 text-sm uppercase font-bold hover:bg-foreground hover:text-background"
                                                onClick={() => selectCompany(c)}
                                            >
                                                {c}
                                            </button>
                                        ))}
                                        {canCreate && (
                                            <button
                                                className="w-full text-left px-3 py-2 text-sm uppercase font-bold opacity-50 hover:opacity-100 hover:bg-foreground hover:text-background"
                                                onClick={() => selectCompany(companyQuery)}
                                            >
                                                + Add &quot;{companyQuery}&quot;
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>

                            <input
                                className="w-full border-b border-foreground text-xs outline-none bg-transparent py-1 placeholder:opacity-30"
                                placeholder="Role"
                                value={expInput.role}
                                onChange={(e) => setExpInput((p) => ({ ...p, role: e.target.value }))}
                            />

                            <button
                                onClick={addExperience}
                                className="font-mono text-[10px] uppercase border border-foreground px-3 py-1 hover:bg-foreground hover:text-background transition-colors"
                            >
                                Add Experience
                            </button>
                        </div>
                    </div>

                    {saveError && (
                        <p className="text-[10px] uppercase text-red-600 font-mono">
                            {saveError}
                        </p>
                    )}

                    {/* Save */}
                    <button
                        onClick={handleSave}
                        className="w-full border-2 border-foreground py-2 font-bold uppercase text-sm hover:bg-foreground hover:text-background transition-colors"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
    return (
        <div className="flex flex-col gap-1">
            <label className="font-mono text-[10px] uppercase opacity-50">{label}</label>
            <input
                className="border-b border-foreground text-sm outline-none bg-transparent py-1"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
}
"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Experience, Profile } from "@/types"


interface Props {
    initial: Profile;
    onSave: (data: Profile) => void;
    onClose: () => void;
}

// TODO: Replace with a supabase call to companies table
const COMPANIES = ["Ubisoft", "Bold Commerce", "SkipTheDishes", "AAFC", "Niche"];

export default function EditProfileModal({ initial, onSave, onClose }: Props) {
    const emptyProfile: Profile = {
        name: "",
        grad_year: "",
        linkedin: "",
        github: "",
        experiences: [],
    };

    const [form, setForm] = useState<Profile>(initial || emptyProfile);

    const [expInput, setExpInput] = useState({ company: "", role: "" });
    const [companyQuery, setCompanyQuery] = useState("");
    const [showSuggestions, setShowSuggestions] = useState(false);

    function handleField(field: keyof Profile, value: string) {
        setForm((prev) => ({ ...prev, [field]: value }));
    }

    const suggestions = companyQuery.length > 0 ? COMPANIES.filter((c) => c.toLowerCase().includes(companyQuery.toLowerCase())) : [];
    const canCreate = companyQuery.length > 0 && !COMPANIES.some((c) => c.toLowerCase() === companyQuery.toLowerCase());

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

    function handleSave() {
        // TODO: supabase call goes here to update or insert profile
        onSave(form);
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
                    <p className="font-mono text-xs uppercase tracking-widest">Edit Profile</p>
                    <button onClick={onClose} aria-label="Close">
                        <X size={16} />
                    </button>
                </div>

                <div className="px-6 py-6 space-y-6">
                    <div className="space-y-4">
                        <p className="font-mono text-[10px] uppercase opacity-50 tracking-widest">Info</p>
                        <Field label="Name" value={form.name ?? ""} onChange={(v) => handleField("name", v)} />
                        <Field label="Grad Year" value={form.grad_year ?? ""} onChange={(v) => handleField("grad_year", v)} />
                        <Field label="LinkedIn URL" value={form.linkedin ?? ""} onChange={(v) => handleField("linkedin", v)} />
                        <Field label="GitHub URL" value={form.github ?? ""} onChange={(v) => handleField("github", v)} />
                    </div>

                    <div className="space-y-3">
                        <p className="font-mono text-[10px] uppercase opacity-50 tracking-widest">Experience</p>
                        {(form.experiences ?? []).map((exp, i) => (
                            <div key={i} className="flex justify-between items-center border-l-2 border-black pl-3">
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
                                        setExpInput((p) => ({ ...p, company: e.target.value }));
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
                                value={expInput.role}
                                onChange={(e) => setExpInput((p) => ({ ...p, role: e.target.value }))}
                            />

                            <button
                                onClick={addExperience}
                                className="font-mono text-[10px] uppercase border border-black px-3 py-1 hover:bg-black hover:text-white transition-colors"
                            >
                                Add Experience
                            </button>
                        </div>
                    </div>

                    {/* Save */}
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

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
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
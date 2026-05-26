// Thank Peter for his pre-made components
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Github, Linkedin, Pencil } from "lucide-react";


interface Experience {
  company: string;
  role: string;
}

interface Profile {
  name?: string;
  grad_year?: string;
  linkedin?: string;
  github?: string;
  experiences?: Experience[];
}

interface ProfileCardProps {
  profile: Profile | null;
  editable?: boolean;
  onEdit?: () => void;
}

// Destructure the prop, ignore all types for now unless we want to add an interface later on
// Thank Peter for his pre-made components

// This is resuable
export default function ProfileCard({ profile, editable = false, onEdit }: ProfileCardProps) {
  if (!profile) return null;

  const isProfileEmpty = !profile.name;

  return (
    <Card className="rounded-none border-2 border-black shadow-none hover:bg-black hover:text-white transition-colors group">
      <CardHeader className="flex flex-row justify-between items-start pb-2">
        <div>
          <CardTitle className="font-bold text-xl uppercase tracking-tighter">
            {isProfileEmpty ? (
              <span className="opacity-30">[NEW_ENTRY]</span>
            ) : (
              profile.name
            )}
          </CardTitle>

          <div className="flex gap-3 mt-2">
            {profile?.linkedin ? (
              <a href={profile.linkedin} target="_blank" rel="noreferrer">
                <Linkedin size={16} className="cursor-pointer hover:opacity-50" />
              </a>
            ) : (
              <Linkedin size={16} className="opacity-20" />
            )}
            {profile?.github ? (
              <a href={profile.github} target="_blank" rel="noreferrer">
                <Github size={16} className="cursor-pointer hover:opacity-50" />
              </a>
            ) : (
              <Github size={16} className="opacity-20" />
            )}
          </div>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="font-mono text-xs border border-black px-2 group-hover:border-white shrink-0">
            {profile?.grad_year ?? "----"}
          </span>

          {editable && (
            <button
              onClick={onEdit}
              className="p-1 border border-transparent hover:border-black group-hover:hover:border-white transition-all"
              aria-label="Edit profile"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {(profile.experiences ?? []).map((exp: Experience, i: number) => (
          <div key={i} className="border-l-2 border-black group-hover:border-white pl-3 transition-colors">
            <p className="text-sm font-bold uppercase leading-tight">{exp.company}</p>
            <p className="text-xs opacity-70 italic">{exp.role}</p>
          </div>
        ))}

        {(!profile.experiences || profile.experiences.length === 0) && (
          <p className="text-[10px] uppercase opacity-30 italic">No history available</p>
        )}
      </CardContent>
    </Card>
  );
}
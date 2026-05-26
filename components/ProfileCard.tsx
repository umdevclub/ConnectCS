// Thank Peter for his pre-made components
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Github, Linkedin, ExternalLink } from "lucide-react";


// Destructure the prop, ignore all types for now unless we want to add an interface later on
export default function ProfileCard({ profile }: { profile: any }) {
  return (
    <Card className="rounded-none border-2 border-black shadow-none hover:bg-black hover:text-white transition-colors group">
      <CardHeader className="flex flex-row justify-between items-start pb-2">
        <div>
          <CardTitle className="font-bold text-xl uppercase tracking-tighter">
            {profile.name}
          </CardTitle>
          <div className="flex gap-3 mt-2">
            {/* Technically these are deprecated but they still work. We should move to SimpleIcons if we care */}
            <Linkedin size={16} className="cursor-pointer hover:opacity-50" />
            <Github size={16} className="cursor-pointer hover:opacity-50" />
          </div>
        </div>
        <span className="font-mono text-xs border border-black px-2 group-hover:border-white">
          {profile.grad_year}
        </span>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {profile.experiences.map((exp: any, i: number) => (
          <div key={i} className="border-l-2 border-black group-hover:border-white pl-3">
            <p className="text-sm font-bold uppercase">{exp.company}</p>
            <p className="text-xs opacity-80">{exp.role}</p>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
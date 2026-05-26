export type UserID = string;

export type TermSeason = "Fall" | "Winter" | "Summer";

export type Term = [season: TermSeason, year: number];

export type ContactType =
  | "Website"
  | "Email"
  | "LinkedIn"
  | "GitHub"
  | "X"
  | "Instagram"
  | "Other";

export type Contact = [type: ContactType, value: string];

export type ExperienceType =
  | "Permanent Full-Time"
  | "Contract Full-Time"
  | "Contract Part-Time"
  | "Internship"
  | "Work Term 1"
  | "Work Term 2"
  | "Work Term 3"
  | "Work Term 4"
  | "Other";

export type DateTime = Date;

export type Experience = [
  type: ExperienceType,
  roleName: string,
  company: string,
  startDate: DateTime,
  endDate: DateTime | null,
];

export interface ProfileDTO {
  userId: UserID;
  name: string;
  startTerm: Term;
  endTerm?: Term | null;
  contact: Contact[];
  experience: Experience[];
  createdAt: DateTime;
  updatedAt: DateTime;
}

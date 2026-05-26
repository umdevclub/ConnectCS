export interface ExperienceDTO {
  company: string;
  role: string;
}

export interface ProfileDTO {
  id?: string;
  name: string;
  start_term: string;
  grad_year?: string;
  linkedin?: string;
  github?: string;
  experiences: ExperienceDTO[];
}

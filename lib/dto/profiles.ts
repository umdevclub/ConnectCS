export interface ExperienceDTO {
  company: string;
  role: string;
}

export interface ProfileDTO {
  name?: string;
  grad_year?: string;
  linkedin?: string;
  github?: string;
  experiences?: ExperienceDTO[];
}

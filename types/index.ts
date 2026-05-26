export interface Experience {
  company: string;
  role: string;
}

export interface Profile {
  name?: string;
  grad_year?: string;
  linkedin?: string;
  github?: string;
  experiences?: Experience[];
}
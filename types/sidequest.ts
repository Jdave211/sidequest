export interface Sidequest {
  id: string;
  title: string;
  description: string;
  category: SidequestCategory;
  location?: string;
  image_urls?: string[];
  review?: string;
  created_at: string;
  updated_at: string;
}

export enum SidequestCategory {
  CREATIVE = "Creative",
  LEARNING = "Learning", 
  FITNESS = "Fitness",
  SOCIAL = "Social",
  CAREER = "Career",
  HOBBY = "Hobby",
  ADVENTURE = "Adventure",
  PRODUCTIVITY = "Productivity",
  HEALTH = "Health",
  OTHER = "Other"
}
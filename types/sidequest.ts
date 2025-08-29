export interface Sidequest {
  id: string;
  title: string;
  description: string;
  category: SidequestCategory;
  difficulty: SidequestDifficulty;
  estimatedTime: string; // e.g., "2 hours", "1 week"
  status: SidequestStatus;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  notes?: string;
  progress?: number; // 0-100
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

export enum SidequestDifficulty {
  EASY = "Easy",
  MEDIUM = "Medium", 
  HARD = "Hard",
  EXPERT = "Expert"
}

export enum SidequestStatus {
  NOT_STARTED = "Not Started",
  IN_PROGRESS = "In Progress",
  COMPLETED = "Completed",
  PAUSED = "Paused",
  ABANDONED = "Abandoned"
}

export interface SidequestTemplate {
  id: string;
  title: string;
  description: string;
  category: SidequestCategory;
  difficulty: SidequestDifficulty;
  estimatedTime: string;
  tags: string[];
  tips?: string[];
  image?: string; // Emoji or image URL
  braggingPoints?: string; // What you can brag about after completing
} 
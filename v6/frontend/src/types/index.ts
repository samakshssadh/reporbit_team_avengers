export type ExperienceLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface UserProfile {
  name: string;
  skills: string[];
  experienceLevel: ExperienceLevel;
  interests: string[];
  preferredDifficulty: 'All' | 'Beginner-Friendly' | 'Intermediate' | 'Challenging';
}

export interface ScoreBreakdown {
  techStackOverlap: number;      // max 40
  difficultyFit: number;         // max 25
  activityAndResponsiveness: number; // max 20
  documentationQuality: number;  // max 15
  explanation: string;
}

export interface MaintainerMetrics {
  medianReviewTime: string; // e.g. "1.5 days"
  mergeRatio: string;       // e.g. "82%"
  activeMaintainers: number;
  cadence: 'Daily' | 'Weekly' | 'Bi-weekly' | 'Sporadic';
  goodFirstIssueResolutionRate: string;
}

export interface ContributionIssue {
  id: string;
  number: number;
  title: string;
  labels: string[];
  url: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
}

export interface Repository {
  id: string;
  platform?: 'github' | 'gitlab' | 'bitbucket';
  starsUnknown?: boolean;
  name: string;
  owner: string;
  fullName: string;
  description: string;
  url: string;
  stars: number;
  forks: number;
  openIssues: number;
  goodFirstIssuesCount: number;
  primaryLanguage: string;
  languages: string[];
  matchedSkills: string[];
  topics: string[];
  difficulty: 'Beginner-Friendly' | 'Intermediate' | 'Challenging';
  matchScore: number; // 0 - 100
  scoreBreakdown: ScoreBreakdown;
  maintainerMetrics: MaintainerMetrics;
  recentUpdate: string;
  setupComplexity: 'Low' | 'Medium' | 'High';
  setupCommand?: string;
  readmeCoverage: string; // e.g. "High (Comprehensive Guide)"
  sampleIssues: ContributionIssue[];
  constellation: {
    x: number;
    y: number;
    group: string;
    brightness: number;
  };
}

export interface RoadmapStep {
  stepNumber: number;
  title: string;
  category: 'Environment' | 'Architecture' | 'Issue Selection' | 'Implementation' | 'Testing & PR';
  summary: string;
  details: string[];
  keyFiles: string[];
  commandToRun?: string;
  proTip: string;
  completed?: boolean;
}

export interface ContributionRoadmap {
  repositoryId: string;
  repositoryName: string;
  estimatedTimeToFirstPR: string;
  prerequisites: string[];
  steps: RoadmapStep[];
}

export interface VideoResource {
  id: string;
  title: string;
  channel: string;
  duration?: string;
  url: string;
  level?: string;
}

export interface WebResource {
  id?: string;
  title: string;
  domain: string;
  url: string;
  description: string;
  type: 'Official Docs' | 'Interactive Tutorial' | 'Cheat Sheet' | 'Guide';
}

export interface LearningStage {
  id: string;
  stageNumber: number;
  title: string;
  summary: string;
  concepts: string[];
  keyTakeaways: string[];
  estimatedHours: string;
  videos: VideoResource[];
  websites: WebResource[];
  /** Optional richer course content (used by the Python course). */
  description?: string;
  youCanNow?: string;
  modules?: LearningModule[];
  project?: string;
  quiz?: QuizQuestion[];
}

export interface LearningModule {
  id: string;
  title: string;
  topics: string[];
  tryIt?: string;
}

export interface QuizQuestion {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

export interface LearningPath {
  subject: string;
  title: string;
  tagline: string;
  description: string;
  level: string;
  prerequisites: string[];
  stages: LearningStage[];
}

export interface GitCurriculumTopic {
  id: string;
  title: string;
  commandSnippet: string;
  summary: string;
  realWorldScenario: string;
  steps: string[];
  commonGotcha: string;
  videoResource?: VideoResource;
  docUrl: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  repoContext?: {
    id: string;
    name: string;
    owner: string;
  };
  model: string; // e.g. "Orbit AI"
  isStreaming?: boolean;
}

export interface ChatSession {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  repoContext?: {
    id: string;
    name: string;
    owner: string;
  };
}

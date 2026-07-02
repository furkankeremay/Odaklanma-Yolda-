export type StudyMode = "pomodoro" | "extended" | "tyt" | "ayt";

export type TimerState = "planning" | "focusing" | "break" | "finished";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
}

export interface SessionLog {
  id: string;
  duration: number; // in minutes
  mode: StudyMode;
  goal: string;
  completedAt: string; // ISO string
  success: boolean;
}

export interface SoundPreset {
  id: string;
  name: string;
  description: string;
  icon: string;
}

export type DayOfWeek = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Course {
  id: string;
  name: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
  location: string;
  weekRange: {
    start: number;
    end: number;
  };
  isOddWeek?: boolean;
  isEvenWeek?: boolean;
}

export interface FixedTime {
  id: string;
  name: string;
  dayOfWeek: DayOfWeek;
  startTime: string;
  endTime: string;
}

export interface Schedule {
  courses: Course[];
  fixedTimes: FixedTime[];
  currentWeek: number;
  totalWeeks: number;
  semesterStartDate: string;
}

export type TaskStatus = 'pending' | 'completed' | 'overdue';

export type RepeatType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface RepeatConfig {
  type: RepeatType;
  interval: number;
  endDate?: string;
  daysOfWeek?: DayOfWeek[];
  dayOfMonth?: number;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  dueDate: string;
  estimatedDuration: number;
  urgency: number;
  growthValue: number;
  difficulty: number;
  status: TaskStatus;
  isGrowthTask: boolean;
  createdAt: string;
  scheduledStartTime?: string;
  scheduledEndTime?: string;
  repeatConfig?: RepeatConfig;
  parentTaskId?: string;
}

export interface ScoringRules {
  urgencyWeight: number;
  growthValueWeight: number;
  difficultyWeight: number;
  durationWeight: number;
  growthTaskMultiplier: number;
}

export interface TimeBlock {
  id: string;
  type: 'course' | 'fixed' | 'task' | 'free';
  title: string;
  startTime: string;
  endTime: string;
  dayOfWeek: DayOfWeek;
  course?: Course;
  fixedTime?: FixedTime;
  task?: Task;
}

export interface AppState {
  tasks: Task[];
  schedule: Schedule;
  scoringRules: ScoringRules;
}

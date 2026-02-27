import React, { createContext, useContext, useReducer } from 'react';
import type { Task, Schedule, ScoringRules, AppState } from '../types';

const STORAGE_KEY = 'mytodo-app-state';

const initialSchedule: Schedule = {
  courses: [],
  fixedTimes: [],
  currentWeek: 1,
  totalWeeks: 18,
  semesterStartDate: new Date().toISOString().split('T')[0],
};

const initialScoringRules: ScoringRules = {
  urgencyWeight: 0.35,
  growthValueWeight: 0.3,
  difficultyWeight: 0.2,
  durationWeight: 0.15,
  growthTaskMultiplier: 1.5,
};

const initialState: AppState = {
  tasks: [],
  schedule: initialSchedule,
  scoringRules: initialScoringRules,
};

function loadState(): AppState {
  try {
    const savedState = localStorage.getItem(STORAGE_KEY);
    if (savedState) {
      return JSON.parse(savedState);
    }
  } catch (e) {
    console.error('Failed to load state from localStorage:', e);
  }
  return initialState;
}

function saveState(state: AppState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error('Failed to save state to localStorage:', e);
  }
}

type Action =
  | { type: 'ADD_TASK'; payload: Task }
  | { type: 'UPDATE_TASK'; payload: Task }
  | { type: 'REMOVE_TASK'; payload: string }
  | { type: 'UPDATE_SCHEDULE'; payload: Partial<Schedule> }
  | { type: 'UPDATE_SCORING_RULES'; payload: Partial<ScoringRules> };

function calculateNextRepeatDate(task: Task): string | null {
  if (!task.repeatConfig || task.repeatConfig.type === 'none') {
    return null;
  }

  const currentDate = new Date(task.dueDate);
  const { type, interval, endDate } = task.repeatConfig;

  let nextDate: Date;

  switch (type) {
    case 'daily':
      nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + interval);
      break;
    case 'weekly':
      nextDate = new Date(currentDate);
      nextDate.setDate(nextDate.getDate() + interval * 7);
      break;
    case 'monthly':
      nextDate = new Date(currentDate);
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;
    default:
      return null;
  }

  if (endDate && nextDate > new Date(endDate)) {
    return null;
  }

  return nextDate.toISOString().split('T')[0];
}

function appReducer(state: AppState, action: Action): AppState {
  let newState: AppState;

  switch (action.type) {
    case 'ADD_TASK':
      newState = {
        ...state,
        tasks: [...state.tasks, action.payload],
      };
      break;
    case 'UPDATE_TASK':
      const updatedTask = action.payload;
      const updatedTasks = state.tasks.map(task =>
        task.id === updatedTask.id ? updatedTask : task
      );

      let finalTasks = updatedTasks;

      if (updatedTask.status === 'completed' && updatedTask.repeatConfig) {
        const nextDate = calculateNextRepeatDate(updatedTask);
        if (nextDate) {
          // 计算新任务的紧急度，基于距离截止日期的天数
          const nextTaskDate = new Date(nextDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          nextTaskDate.setHours(0, 0, 0, 0);
          const daysUntilDue = Math.ceil((nextTaskDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
          
          // 根据距离截止日期的天数调整紧急度
          let newUrgency = updatedTask.urgency;
          if (daysUntilDue <= 0) {
            newUrgency = 10; // 已逾期，紧急度最高
          } else if (daysUntilDue <= 1) {
            newUrgency = 9;
          } else if (daysUntilDue <= 3) {
            newUrgency = 7;
          } else if (daysUntilDue <= 7) {
            newUrgency = 5;
          } else {
            newUrgency = 3;
          }
          
          const nextTask: Task = {
            ...updatedTask,
            id: Date.now().toString(),
            dueDate: nextDate,
            urgency: newUrgency,
            status: 'pending',
            createdAt: new Date().toISOString(),
            parentTaskId: updatedTask.id
          };
          // 生成新任务的同时，删除已完成的任务
          finalTasks = finalTasks.filter(task => task.id !== updatedTask.id);
          finalTasks = [...finalTasks, nextTask];
        } else {
          // 如果没有下一个重复日期（达到了结束日期），则删除已完成的任务
          finalTasks = finalTasks.filter(task => task.id !== updatedTask.id);
        }
      }

      newState = {
        ...state,
        tasks: finalTasks,
      };
      break;
    case 'REMOVE_TASK':
      newState = {
        ...state,
        tasks: state.tasks.filter(task => task.id !== action.payload),
      };
      break;
    case 'UPDATE_SCHEDULE':
      newState = {
        ...state,
        schedule: { ...state.schedule, ...action.payload },
      };
      break;
    case 'UPDATE_SCORING_RULES':
      newState = {
        ...state,
        scoringRules: { ...state.scoringRules, ...action.payload },
      };
      break;
    default:
      newState = state;
  }

  saveState(newState);
  return newState;
}

interface AppContextType {
  state: AppState;
  dispatch: React.Dispatch<Action>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState, loadState);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};

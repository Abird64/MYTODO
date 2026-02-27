import type { Task, ScoringRules } from '../types';

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

export function calculateTaskScore(task: Task, rules: ScoringRules): number {
  let score = 0;
  score += task.urgency * rules.urgencyWeight;
  score += task.growthValue * rules.growthValueWeight;
  score += task.difficulty * rules.difficultyWeight;
  const durationFactor = Math.max(0, 1 - (task.estimatedDuration / 120));
  score += durationFactor * 10 * rules.durationWeight;
  if (task.isGrowthTask) {
    score *= rules.growthTaskMultiplier;
  }
  return score;
}

export function sortTasksByScore(tasks: Task[], rules: ScoringRules): Task[] {
  return [...tasks].sort((a, b) => calculateTaskScore(b, rules) - calculateTaskScore(a, rules));
}

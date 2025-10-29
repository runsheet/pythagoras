/**
 * Represents a step in the execution plan
 */
export interface PlanStep {
  step: number;
  action: string;
  reasoning: string;
  tool?: string;
  completed: boolean;
}

/**
 * Represents the complete execution plan
 */
export interface ExecutionPlan {
  objective: string;
  steps: PlanStep[];
  reasoning: string;
}

/**
 * Result of executing a plan
 */
export interface ExecutionResult {
  plan: ExecutionPlan;
  results: StepResult[];
  summary: string;
  patches: FilePatch[];
}

/**
 * Result of executing a single step
 */
export interface StepResult {
  step: number;
  success: boolean;
  output: string;
  error?: string;
}

/**
 * File patch to be applied
 */
export interface FilePatch {
  file: string;
  action: 'create' | 'update' | 'delete';
  content?: string;
}

export interface PythangorasAgent {
  run(objective: string): Promise<ExecutionResult>;
}

export type WalkthroughTrade = 'interior_paint';

export type WalkthroughNodeType = 'observe' | 'measure' | 'ask' | 'demonstrate' | 'branch' | 'confirm';
export type WalkthroughInputMode = 'voice' | 'text' | 'camera_photo' | 'camera_video' | 'ar_measure' | 'audio_check';
export type WalkthroughChoiceValue = string | number | boolean;
export type WalkthroughConditionOperator = 'eq' | 'not_eq' | 'gt' | 'gte' | 'lt' | 'lte' | 'includes';

export interface WalkthroughChoice {
  value: WalkthroughChoiceValue;
  label: string;
  description?: string;
}

export interface WalkthroughCondition {
  key: string;
  operator: WalkthroughConditionOperator;
  value: WalkthroughChoiceValue;
}

export interface WalkthroughBranch {
  when: WalkthroughCondition;
  next: string;
}

interface WalkthroughNodeBase {
  id: string;
  type: WalkthroughNodeType;
  title: string;
  prompt: string;
  helpText?: string;
  summaryLabel?: string;
  optional?: boolean;
}

export interface ObserveNode extends WalkthroughNodeBase {
  type: 'observe';
  expectedInput: 'camera_photo' | 'camera_video';
  observationKey: string;
  promptLabel: string;
  next: string;
}

export interface MeasureNode extends WalkthroughNodeBase {
  type: 'measure';
  expectedInput: 'ar_measure';
  measurementKey: string;
  unit: 'linear_ft' | 'sq_ft' | 'count';
  next: string;
}

export interface AskNode extends WalkthroughNodeBase {
  type: 'ask';
  expectedInput: 'voice' | 'text';
  fieldKey: string;
  responseType: 'string' | 'number' | 'boolean' | 'choice' | 'multi_choice';
  choices?: WalkthroughChoice[];
  next: string;
}

export interface DemonstrateNode extends WalkthroughNodeBase {
  type: 'demonstrate';
  expectedInput: 'camera_video' | 'audio_check';
  observationKey: string;
  promptLabel: string;
  next: string;
}

export interface BranchNode extends WalkthroughNodeBase {
  type: 'branch';
  branches: WalkthroughBranch[];
  fallbackNext: string;
}

export interface ConfirmNode extends WalkthroughNodeBase {
  type: 'confirm';
  next?: string;
}

export type WalkthroughNode = ObserveNode | MeasureNode | AskNode | DemonstrateNode | BranchNode | ConfirmNode;

export interface WalkthroughScript {
  id: string;
  trade: WalkthroughTrade;
  version: string;
  label: string;
  intro: string;
  startNodeId: string;
  completionNodeId: string;
  nodes: WalkthroughNode[];
}

export interface WalkthroughAnswer {
  key: string;
  value: WalkthroughChoiceValue | WalkthroughChoiceValue[] | null;
  summaryLabel?: string;
}

export interface WalkthroughObservation {
  key: string;
  summary: string;
  promptLabel?: string;
  signals?: Record<string, WalkthroughChoiceValue | WalkthroughChoiceValue[] | null>;
}

export interface WalkthroughMeasurement {
  key: string;
  value: number;
  unit: MeasureNode['unit'];
}

export interface WalkthroughState {
  scriptId: string;
  scriptVersion: string;
  trade: WalkthroughTrade;
  currentNodeId: string;
  completedNodeIds: string[];
  answers: Record<string, WalkthroughAnswer>;
  observations: Record<string, WalkthroughObservation>;
  measurements: Record<string, WalkthroughMeasurement>;
  startedAt: string;
  updatedAt: string;
  pausedAt?: string | null;
}

export interface WalkthroughAdvanceInput {
  value?: WalkthroughChoiceValue | WalkthroughChoiceValue[] | null;
  summary?: string;
  measurementValue?: number;
  signals?: Record<string, WalkthroughChoiceValue | WalkthroughChoiceValue[] | null>;
}

export interface WalkthroughSummaryItem {
  key: string;
  label: string;
  value: string;
}

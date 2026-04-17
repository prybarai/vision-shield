import type { WalkthroughAdvanceInput, WalkthroughNode } from './types';

export interface VoiceTurn {
  transcript: string;
  confidence?: number;
  audioUrl?: string;
}

export interface CaptureResult {
  summary: string;
  assetUrl?: string;
  signals?: Record<string, string | number | boolean | Array<string | number | boolean> | null>;
}

export interface MeasurementResult {
  value: number;
  unit: 'linear_ft' | 'sq_ft' | 'count';
  confidence?: number;
}

export interface VoiceAdapter {
  startTurn(node: WalkthroughNode): Promise<void>;
  completeTurn(node: WalkthroughNode): Promise<VoiceTurn>;
}

export interface CaptureAdapter {
  capture(node: WalkthroughNode): Promise<CaptureResult>;
}

export interface MeasurementAdapter {
  measure(node: WalkthroughNode): Promise<MeasurementResult>;
}

export type NodeAdapterPayload = WalkthroughAdvanceInput & {
  adapterKind?: 'voice' | 'camera' | 'measurement' | 'audio';
  assetUrl?: string;
  confidence?: number;
};

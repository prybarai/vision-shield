import { advanceWalkthrough, buildConfirmSummary, createWalkthroughState, getWalkthroughNode, getWalkthroughProgress, pauseWalkthroughState, resumeWalkthroughState } from './engine';
import { loadWalkthroughScript } from './scripts';
import { type WalkthroughAdvanceInput, type WalkthroughScript, type WalkthroughState, type WalkthroughTrade } from './types';

type WalkthroughSessionRecord = {
  sessionId: string;
  script: WalkthroughScript;
  state: WalkthroughState;
  createdAt: string;
  updatedAt: string;
};

declare global {
  var __NAILI_WALKTHROUGH_STORE__: Map<string, WalkthroughSessionRecord> | undefined;
}

function getStore() {
  if (!globalThis.__NAILI_WALKTHROUGH_STORE__) {
    globalThis.__NAILI_WALKTHROUGH_STORE__ = new Map();
  }
  return globalThis.__NAILI_WALKTHROUGH_STORE__;
}

function nowIso() {
  return new Date().toISOString();
}

function toSnapshot(record: WalkthroughSessionRecord) {
  return {
    sessionId: record.sessionId,
    script: {
      id: record.script.id,
      trade: record.script.trade,
      version: record.script.version,
      label: record.script.label,
      intro: record.script.intro,
      completionNodeId: record.script.completionNodeId,
      startNodeId: record.script.startNodeId,
      nodeCount: record.script.nodes.length,
    },
    state: record.state,
    currentNode: getWalkthroughNode(record.script, record.state.currentNodeId),
    progress: getWalkthroughProgress(record.script, record.state),
    confirmSummary: buildConfirmSummary(record.script, record.state),
  };
}

export async function createWalkthroughSession(params: { trade: WalkthroughTrade; version?: string }) {
  const script = await loadWalkthroughScript(params.trade, params.version);
  const sessionId = crypto.randomUUID();
  const record: WalkthroughSessionRecord = {
    sessionId,
    script,
    state: createWalkthroughState(script),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  getStore().set(sessionId, record);
  return toSnapshot(record);
}

export function getWalkthroughSession(sessionId: string) {
  const record = getStore().get(sessionId);
  if (!record) return null;
  return toSnapshot(record);
}

export function advanceWalkthroughSession(sessionId: string, input: WalkthroughAdvanceInput) {
  const store = getStore();
  const record = store.get(sessionId);
  if (!record) return null;

  const nextState = advanceWalkthrough(record.script, resumeWalkthroughState(record.state), input);
  const nextRecord: WalkthroughSessionRecord = {
    ...record,
    state: nextState,
    updatedAt: nowIso(),
  };
  store.set(sessionId, nextRecord);
  return toSnapshot(nextRecord);
}

export function pauseWalkthroughSession(sessionId: string) {
  const store = getStore();
  const record = store.get(sessionId);
  if (!record) return null;

  const nextRecord: WalkthroughSessionRecord = {
    ...record,
    state: pauseWalkthroughState(record.state),
    updatedAt: nowIso(),
  };
  store.set(sessionId, nextRecord);
  return toSnapshot(nextRecord);
}

export function resumeWalkthroughSession(sessionId: string) {
  const store = getStore();
  const record = store.get(sessionId);
  if (!record) return null;

  const nextRecord: WalkthroughSessionRecord = {
    ...record,
    state: resumeWalkthroughState(record.state),
    updatedAt: nowIso(),
  };
  store.set(sessionId, nextRecord);
  return toSnapshot(nextRecord);
}

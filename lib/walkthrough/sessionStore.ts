import { advanceWalkthrough, buildConfirmSummary, createWalkthroughState, getWalkthroughNode, getWalkthroughProgress, pauseWalkthroughState, resumeWalkthroughState } from './engine';
import { loadWalkthroughScript } from './scripts';
import { type WalkthroughAdvanceInput, type WalkthroughScript, type WalkthroughState, type WalkthroughTrade } from './types';
import { supabaseAdmin } from '@/lib/supabase/admin';

type WalkthroughSessionRecord = {
  sessionId: string;
  script: WalkthroughScript;
  state: WalkthroughState;
  createdAt: string;
  updatedAt: string;
};

type WalkthroughSessionRow = {
  id: string;
  trade: WalkthroughTrade;
  script_id: string;
  script_version: string;
  status: WalkthroughState['status'];
  state_json: WalkthroughState;
  created_at: string;
  updated_at: string;
};

declare global {
  var __NAILI_WALKTHROUGH_STORE__: Map<string, WalkthroughSessionRecord> | undefined;
}

function getMemoryStore() {
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

function canUseSupabase() {
  return Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function rowToRecord(row: WalkthroughSessionRow): Promise<WalkthroughSessionRecord> {
  const script = await loadWalkthroughScript(row.trade, row.script_version);
  return {
    sessionId: row.id,
    script,
    state: row.state_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function createInMemorySession(params: { trade: WalkthroughTrade; version?: string }) {
  const script = await loadWalkthroughScript(params.trade, params.version);
  const sessionId = crypto.randomUUID();
  const record: WalkthroughSessionRecord = {
    sessionId,
    script,
    state: createWalkthroughState(script),
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };

  getMemoryStore().set(sessionId, record);
  return toSnapshot(record);
}

async function getInMemorySession(sessionId: string) {
  const record = getMemoryStore().get(sessionId);
  if (!record) return null;
  return toSnapshot(record);
}

async function updateInMemorySession(sessionId: string, updater: (record: WalkthroughSessionRecord) => WalkthroughSessionRecord) {
  const store = getMemoryStore();
  const record = store.get(sessionId);
  if (!record) return null;
  const nextRecord = updater(record);
  store.set(sessionId, nextRecord);
  return toSnapshot(nextRecord);
}

export async function createWalkthroughSession(params: { trade: WalkthroughTrade; version?: string }) {
  if (!canUseSupabase()) {
    return createInMemorySession(params);
  }

  try {
    const script = await loadWalkthroughScript(params.trade, params.version);
    const state = createWalkthroughState(script);
    const { data, error } = await supabaseAdmin
      .from('walkthrough_sessions')
      .insert({
        trade: script.trade,
        script_id: script.id,
        script_version: script.version,
        status: state.status,
        state_json: state,
      })
      .select('id, trade, script_id, script_version, status, state_json, created_at, updated_at')
      .single();

    if (error || !data) {
      console.error('walkthrough session create db error:', error);
      return createInMemorySession(params);
    }

    return toSnapshot(await rowToRecord(data as WalkthroughSessionRow));
  } catch (error) {
    console.error('walkthrough session create fallback:', error);
    return createInMemorySession(params);
  }
}

export async function getWalkthroughSession(sessionId: string) {
  if (!canUseSupabase()) {
    return getInMemorySession(sessionId);
  }

  try {
    const { data, error } = await supabaseAdmin
      .from('walkthrough_sessions')
      .select('id, trade, script_id, script_version, status, state_json, created_at, updated_at')
      .eq('id', sessionId)
      .single();

    if (error || !data) {
      return getInMemorySession(sessionId);
    }

    return toSnapshot(await rowToRecord(data as WalkthroughSessionRow));
  } catch (error) {
    console.error('walkthrough session get fallback:', error);
    return getInMemorySession(sessionId);
  }
}

export async function advanceWalkthroughSession(sessionId: string, input: WalkthroughAdvanceInput) {
  if (!canUseSupabase()) {
    return updateInMemorySession(sessionId, (record) => ({
      ...record,
      state: advanceWalkthrough(record.script, resumeWalkthroughState(record.state), input),
      updatedAt: nowIso(),
    }));
  }

  try {
    const current = await getWalkthroughSession(sessionId);
    if (!current) return null;

    const script = await loadWalkthroughScript(current.script.trade as WalkthroughTrade, current.script.version);
    const nextState = advanceWalkthrough(script, resumeWalkthroughState(current.state), input);
    const { data, error } = await supabaseAdmin
      .from('walkthrough_sessions')
      .update({
        status: nextState.status,
        state_json: nextState,
        updated_at: nowIso(),
      })
      .eq('id', sessionId)
      .select('id, trade, script_id, script_version, status, state_json, created_at, updated_at')
      .single();

    if (error || !data) {
      console.error('walkthrough advance db error:', error);
      return updateInMemorySession(sessionId, (record) => ({
        ...record,
        state: nextState,
        updatedAt: nowIso(),
      }));
    }

    return toSnapshot(await rowToRecord(data as WalkthroughSessionRow));
  } catch (error) {
    console.error('walkthrough advance fallback:', error);
    return updateInMemorySession(sessionId, (record) => ({
      ...record,
      state: advanceWalkthrough(record.script, resumeWalkthroughState(record.state), input),
      updatedAt: nowIso(),
    }));
  }
}

export async function pauseWalkthroughSession(sessionId: string) {
  if (!canUseSupabase()) {
    return updateInMemorySession(sessionId, (record) => ({
      ...record,
      state: pauseWalkthroughState(record.state),
      updatedAt: nowIso(),
    }));
  }

  try {
    const current = await getWalkthroughSession(sessionId);
    if (!current) return null;

    const nextState = pauseWalkthroughState(current.state);
    const { data, error } = await supabaseAdmin
      .from('walkthrough_sessions')
      .update({
        status: nextState.status,
        state_json: nextState,
        updated_at: nowIso(),
      })
      .eq('id', sessionId)
      .select('id, trade, script_id, script_version, status, state_json, created_at, updated_at')
      .single();

    if (error || !data) {
      console.error('walkthrough pause db error:', error);
      return updateInMemorySession(sessionId, (record) => ({
        ...record,
        state: nextState,
        updatedAt: nowIso(),
      }));
    }

    return toSnapshot(await rowToRecord(data as WalkthroughSessionRow));
  } catch (error) {
    console.error('walkthrough pause fallback:', error);
    return updateInMemorySession(sessionId, (record) => ({
      ...record,
      state: pauseWalkthroughState(record.state),
      updatedAt: nowIso(),
    }));
  }
}

export async function resumeWalkthroughSession(sessionId: string) {
  if (!canUseSupabase()) {
    return updateInMemorySession(sessionId, (record) => ({
      ...record,
      state: resumeWalkthroughState(record.state),
      updatedAt: nowIso(),
    }));
  }

  try {
    const current = await getWalkthroughSession(sessionId);
    if (!current) return null;

    const nextState = resumeWalkthroughState(current.state);
    const { data, error } = await supabaseAdmin
      .from('walkthrough_sessions')
      .update({
        status: nextState.status,
        state_json: nextState,
        updated_at: nowIso(),
      })
      .eq('id', sessionId)
      .select('id, trade, script_id, script_version, status, state_json, created_at, updated_at')
      .single();

    if (error || !data) {
      console.error('walkthrough resume db error:', error);
      return updateInMemorySession(sessionId, (record) => ({
        ...record,
        state: nextState,
        updatedAt: nowIso(),
      }));
    }

    return toSnapshot(await rowToRecord(data as WalkthroughSessionRow));
  } catch (error) {
    console.error('walkthrough resume fallback:', error);
    return updateInMemorySession(sessionId, (record) => ({
      ...record,
      state: resumeWalkthroughState(record.state),
      updatedAt: nowIso(),
    }));
  }
}

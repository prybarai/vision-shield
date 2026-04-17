import {
  type AskNode,
  type BranchNode,
  type MeasureNode,
  type WalkthroughAdvanceInput,
  type WalkthroughNode,
  type WalkthroughScript,
  type WalkthroughState,
  type WalkthroughSummaryItem,
} from './types';

function nowIso() {
  return new Date().toISOString();
}

function actionableNodes(script: WalkthroughScript) {
  return script.nodes.filter((node) => node.type !== 'branch');
}

function normalizeSummaryValue(value: unknown) {
  if (Array.isArray(value)) {
    return value.join(', ');
  }
  if (typeof value === 'boolean') {
    return value ? 'Yes' : 'No';
  }
  if (value === null || value === undefined || value === '') {
    return 'Not provided';
  }
  return String(value);
}

export function getWalkthroughNode(script: WalkthroughScript, nodeId: string): WalkthroughNode {
  const node = script.nodes.find((item) => item.id === nodeId);
  if (!node) {
    throw new Error(`Unknown walkthrough node: ${nodeId}`);
  }
  return node;
}

export function createWalkthroughState(script: WalkthroughScript): WalkthroughState {
  const timestamp = nowIso();
  return {
    scriptId: script.id,
    scriptVersion: script.version,
    trade: script.trade,
    status: 'active',
    currentNodeId: script.startNodeId,
    completedNodeIds: [],
    answers: {},
    observations: {},
    measurements: {},
    startedAt: timestamp,
    updatedAt: timestamp,
    pausedAt: null,
  };
}

function evaluateCondition(state: WalkthroughState, condition: BranchNode['branches'][number]['when']) {
  const answer = state.answers[condition.key]?.value;
  const measurement = state.measurements[condition.key]?.value;
  const observationSignal = state.observations[condition.key]?.signals?.value;
  const rawValue = answer ?? measurement ?? observationSignal;

  switch (condition.operator) {
    case 'eq':
      return rawValue === condition.value;
    case 'not_eq':
      return rawValue !== condition.value;
    case 'gt':
      return Number(rawValue) > Number(condition.value);
    case 'gte':
      return Number(rawValue) >= Number(condition.value);
    case 'lt':
      return Number(rawValue) < Number(condition.value);
    case 'lte':
      return Number(rawValue) <= Number(condition.value);
    case 'includes':
      return Array.isArray(rawValue) ? rawValue.includes(condition.value) : String(rawValue || '').includes(String(condition.value));
    default:
      return false;
  }
}

function resolveAutomaticNodes(script: WalkthroughScript, state: WalkthroughState): WalkthroughState {
  let nextState = { ...state };
  let current = getWalkthroughNode(script, nextState.currentNodeId);

  while (current.type === 'branch') {
    const nextNodeId = current.branches.find((branch) => evaluateCondition(nextState, branch.when))?.next || current.fallbackNext;
    nextState = {
      ...nextState,
      currentNodeId: nextNodeId,
      completedNodeIds: nextState.completedNodeIds.includes(current.id)
        ? nextState.completedNodeIds
        : [...nextState.completedNodeIds, current.id],
      updatedAt: nowIso(),
    };
    current = getWalkthroughNode(script, nextState.currentNodeId);
  }

  return nextState;
}

function completeNode(state: WalkthroughState, nodeId: string, nextNodeId: string | undefined) {
  return {
    ...state,
    currentNodeId: nextNodeId || state.currentNodeId,
    completedNodeIds: state.completedNodeIds.includes(nodeId)
      ? state.completedNodeIds
      : [...state.completedNodeIds, nodeId],
    updatedAt: nowIso(),
  };
}

export function pauseWalkthroughState(state: WalkthroughState): WalkthroughState {
  return {
    ...state,
    status: 'paused',
    pausedAt: nowIso(),
    updatedAt: nowIso(),
  };
}

export function resumeWalkthroughState(state: WalkthroughState): WalkthroughState {
  return {
    ...state,
    status: state.status === 'completed' ? 'completed' : 'active',
    pausedAt: null,
    updatedAt: nowIso(),
  };
}

function recordAsk(state: WalkthroughState, node: AskNode, input: WalkthroughAdvanceInput) {
  return {
    ...state,
    answers: {
      ...state.answers,
      [node.fieldKey]: {
        key: node.fieldKey,
        value: input.value ?? null,
        summaryLabel: node.summaryLabel || node.title,
      },
    },
  };
}

function recordMeasurement(state: WalkthroughState, node: MeasureNode, input: WalkthroughAdvanceInput) {
  return {
    ...state,
    measurements: {
      ...state.measurements,
      [node.measurementKey]: {
        key: node.measurementKey,
        value: typeof input.measurementValue === 'number' ? input.measurementValue : 0,
        unit: node.unit,
      },
    },
  };
}

export function advanceWalkthrough(script: WalkthroughScript, state: WalkthroughState, input: WalkthroughAdvanceInput = {}) {
  const node = getWalkthroughNode(script, state.currentNodeId);
  let nextState = { ...state };

  switch (node.type) {
    case 'ask':
      nextState = recordAsk(nextState, node, input);
      nextState = completeNode(nextState, node.id, node.next);
      break;
    case 'observe':
    case 'demonstrate':
      nextState = {
        ...nextState,
        observations: {
          ...nextState.observations,
          [node.observationKey]: {
            key: node.observationKey,
            summary: input.summary || 'Captured',
            promptLabel: node.promptLabel,
            signals: input.signals,
          },
        },
      };
      nextState = completeNode(nextState, node.id, node.next);
      break;
    case 'measure':
      nextState = recordMeasurement(nextState, node, input);
      nextState = completeNode(nextState, node.id, node.next);
      break;
    case 'confirm':
      nextState = completeNode(nextState, node.id, node.next || script.completionNodeId);
      nextState = {
        ...nextState,
        status: node.next ? nextState.status : 'completed',
      };
      break;
    case 'branch':
      nextState = completeNode(nextState, node.id, node.fallbackNext);
      break;
    default:
      break;
  }

  return resolveAutomaticNodes(script, nextState);
}

export function getWalkthroughProgress(script: WalkthroughScript, state: WalkthroughState) {
  const total = actionableNodes(script).length;
  const completed = state.completedNodeIds.filter((nodeId) => {
    const node = script.nodes.find((item) => item.id === nodeId);
    return node && node.type !== 'branch';
  }).length;

  return {
    completed: state.status === 'completed' ? total : completed,
    total,
    percent: total === 0 ? 0 : Math.round(((state.status === 'completed' ? total : completed) / total) * 100),
  };
}

export function buildConfirmSummary(script: WalkthroughScript, state: WalkthroughState): WalkthroughSummaryItem[] {
  return actionableNodes(script).flatMap((node) => {
    if (!node.summaryLabel) return [];

    if (node.type === 'ask') {
      const answer = state.answers[node.fieldKey]?.value;
      if (answer === undefined) return [];
      return [{ key: node.fieldKey, label: node.summaryLabel, value: normalizeSummaryValue(answer) }];
    }

    if (node.type === 'measure') {
      const measurement = state.measurements[node.measurementKey];
      if (!measurement) return [];
      return [{ key: node.measurementKey, label: node.summaryLabel, value: `${measurement.value} ${measurement.unit}` }];
    }

    if (node.type === 'observe' || node.type === 'demonstrate') {
      const observation = state.observations[node.observationKey];
      if (!observation) return [];
      return [{ key: node.observationKey, label: node.summaryLabel, value: observation.summary }];
    }

    return [];
  });
}

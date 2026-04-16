/**
 * Session Hook — manta session lifecycle
 * 
 * ONLY fires for manta agent sessions.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../../shared/gates.js';
import { EvidenceCollector } from '../../shared/evidence.js';
import type { MantaCoordinator } from '../../manta/coordinator.js';
import { isMantaAgent } from '../../shared/agent-identity.js';
import { setCurrentAgent, clearCurrentAgent } from './agent-state.js';
import type { StateStore } from '../../shared/state-store.js';
import type { MantaMessenger } from '../../shared/messenger.js';
import * as path from 'node:path';
import * as fs from 'node:fs';

let dirCreationAttempted = false;

export function createSessionHook(
  gateManager: GateManager,
  _evidenceCollector: EvidenceCollector,
  coordinator: MantaCoordinator | undefined,
  stateStore: StateStore,
  messenger: MantaMessenger
): Hooks['event'] {
  return async (input) => {
    const event = input.event as { type?: string; sessionId?: string; agent?: string };
    
    if (!event?.type) return;

    if (!isMantaAgent(event.agent)) {
      setCurrentAgent(undefined);
      return;
    }

    setCurrentAgent(event.agent);

    switch (event.type) {
      case 'session.created':
        handleSessionCreated(gateManager, coordinator);
        break;
      case 'session.ended':
        handleSessionEnded(stateStore, messenger);
        break;
    }
  };
}

function handleSessionCreated(
  gateManager: GateManager,
  coordinator?: MantaCoordinator
): void {
  gateManager.restore({
    currentGate: 'plan',
    gateStatus: {
      plan: 'pending',
      build: 'pending',
      test: 'pending',
      verify: 'pending',
      audit: 'pending',
      delivery: 'pending',
    },
    verifyAttempts: 0,
    currentIteration: 'V1.0',
    iterationAttempts: {},
  });

  if (coordinator) {
    coordinator.initialize();
  }

  if (!dirCreationAttempted) {
    dirCreationAttempted = true;
    const mantaDir = path.join(process.cwd(), '.manta');
    fs.mkdirSync(mantaDir, { recursive: true });
    fs.mkdirSync(path.join(mantaDir, 'evidence'), { recursive: true });
    fs.mkdirSync(path.join(mantaDir, 'checkpoints'), { recursive: true });
  }
}

function handleSessionEnded(
  stateStore: StateStore,
  messenger: MantaMessenger
): void {
  stateStore.cleanup();
  messenger.cleanup();
  dirCreationAttempted = false;
  setCurrentAgent(undefined);
  clearCurrentAgent();
}

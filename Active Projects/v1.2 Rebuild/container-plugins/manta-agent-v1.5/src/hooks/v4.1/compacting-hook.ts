/**
 * Session Compacting Hook — experimental.session.compacting integration
 * 
 * Snapshots gate state before context compression.
 * Uses getCurrentAgent() like shark.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../../shared/gates.js';
import { getCurrentAgent } from './agent-state.js';
import * as path from 'node:path';
import * as fs from 'node:fs';

export function createCompactingHook(
  gateManager: GateManager
): Hooks['experimental.session.compacting'] {
  return async (input, output) => {
    if (!getCurrentAgent()) {
      return;
    }
    
    const { sessionID } = input;

    const state = gateManager.getState();
    const sessionDir = path.join(process.cwd(), '.manta', 'sessions', sessionID);

    try {
      await fs.promises.mkdir(sessionDir, { recursive: true });
      await fs.promises.writeFile(
        path.join(sessionDir, 'gate-state.json'),
        JSON.stringify(state, null, 2)
      );
      
      const contextOutput = output as { context: string[] };
      if (contextOutput.context) {
        contextOutput.context.push(`[Manta] Gate state snapshot saved: ${state.currentGate} gate, ${state.currentIteration}`);
      }
    } catch (err) {
      // Silent fail
    }
  };
}

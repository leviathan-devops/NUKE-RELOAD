/**
 * System Transform Hook — manta enforcement context injection
 * 
 * Uses getCurrentAgent() like shark to avoid CLI mode issues.
 */
import type { Hooks } from '@opencode-ai/plugin';
import { GateManager } from '../shared/gates.js';
import type { MantaCoordinator } from '../manta/coordinator.js';
import { getCurrentAgent } from './agent-state.js';

export function createSystemTransformHook(
  gateManager: GateManager,
  coordinator?: MantaCoordinator
): Hooks['experimental.chat.system.transform'] {
  return async (input, output) => {
    if (!getCurrentAgent()) {
      return;
    }

    const state = gateManager.getState();
    const criteria = gateManager.getCriteria(state.currentGate as any);

    const enforcementContext = `
[MANT A ENFORCEMENT CONTEXT]
Current Gate: ${(state.currentGate as string).toUpperCase()}
Iteration: ${state.currentIteration}
Verify Attempts: ${state.verifyAttempts}/3

Blocking Criteria for ${state.currentGate}:
${criteria.blockingCriteria.map((c: string) => `  - ${c}`).join('\n')}

Evidence Required:
${criteria.evidenceRequired.map((e: string) => `  - ${e}`).join('\n')}
`.trim();

    const systemOutput = output as { system: string[]; agent?: string };
    if (Array.isArray(systemOutput.system)) {
      systemOutput.system.push(enforcementContext);

      if (coordinator) {
        const currentBrain = coordinator.getCurrentBrain();
        const brainContext = `
[MANT A BRAIN CONTEXT]
Active Brain: ${currentBrain.toUpperCase()}
Brain switching is MECHANICAL — the Coordinator controls which brain is active.
Do NOT switch brains manually. Wait for Coordinator signals.
`.trim();
        systemOutput.system.push(brainContext);
      }
    }
  };
}

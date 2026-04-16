/**
 * Domain Ownership Rules
 * 
 * V2.0: Defines which brains can write to which state domains.
 * Mechanical enforcement - no text matching.
 */

export const DOMAIN_OWNERSHIP = {
  // Kraken orchestrator domains
  'planning-state': ['kraken-planning', 'kraken-system'],
  'execution-state': ['kraken-execution', 'kraken-system'],
  'thinking-state': ['kraken-reasoning', 'kraken-system'],
  'context-bridge': ['kraken-planning'],
  'workflow-state': ['kraken-system', 'kraken-execution'],
  'security-state': ['kraken-system'],
  'quality-state': ['kraken-execution', 'kraken-system'],
  
  // Subagent domains
  'container-state': ['kraken-subagent'],
  'execution-queue': ['kraken-subagent', 'kraken-execution'],
  
  // Cluster domains
  'alpha-state': ['alpha-execution', 'alpha-system'],
  'beta-state': ['beta-reasoning', 'beta-system'],
  'gamma-state': ['gamma-system', 'gamma-execution'],
  
  // Compaction domains (V2.0 NEW)
  'compaction-state': ['kraken-system'],
  'context-registry': ['kraken-system'],
  'token-budget': ['kraken-system'],
} as const;

export type DomainId = keyof typeof DOMAIN_OWNERSHIP;
export type BrainId = typeof DOMAIN_OWNERSHIP[DomainId][number];

export function canWrite(domain: DomainId, brain: BrainId): boolean {
  return DOMAIN_OWNERSHIP[domain]?.includes(brain) ?? false;
}

export function getOwners(domain: DomainId): readonly BrainId[] {
  return DOMAIN_OWNERSHIP[domain] ?? [];
}

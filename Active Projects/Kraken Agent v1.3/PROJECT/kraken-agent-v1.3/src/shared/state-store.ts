/**
 * State Store - Domain-owned state management
 * 
 * V2.0: Adds compaction-related domains
 */

import { canWrite, type DomainId, type BrainId } from './domain-ownership.js';

export interface StateEntry<T = unknown> {
  value: T;
  owner: BrainId;
  lastModified: Date;
  version: number;
}

export class StateStore {
  private states: Map<DomainId, Map<string, StateEntry>> = new Map();
  
  constructor() {
    // Initialize all domains
    const domains: DomainId[] = [
      'planning-state', 'execution-state', 'thinking-state',
      'context-bridge', 'workflow-state', 'security-state', 'quality-state',
      'container-state', 'execution-queue',
      'alpha-state', 'beta-state', 'gamma-state',
      'compaction-state', 'context-registry', 'token-budget',
    ];
    
    for (const domain of domains) {
      this.states.set(domain, new Map());
    }
  }
  
  get<T>(domain: DomainId, key: string): T | undefined {
    const domainStates = this.states.get(domain);
    if (!domainStates) return undefined;
    
    const entry = domainStates.get(key);
    return entry?.value as T | undefined;
  }
  
  set<T>(domain: DomainId, key: string, value: T, owner: BrainId): void {
    if (!canWrite(domain, owner)) {
      throw new Error(`Brain ${owner} cannot write to domain ${domain}`);
    }
    
    const domainStates = this.states.get(domain);
    if (!domainStates) {
      throw new Error(`Unknown domain: ${domain}`);
    }
    
    const existing = domainStates.get(key);
    domainStates.set(key, {
      value,
      owner,
      lastModified: new Date(),
      version: (existing?.version ?? 0) + 1,
    });
  }
  
  delete(domain: DomainId, key: string, brain: BrainId): boolean {
    if (!canWrite(domain, brain)) {
      throw new Error(`Brain ${brain} cannot delete from domain ${domain}`);
    }
    
    const domainStates = this.states.get(domain);
    if (!domainStates) return false;
    
    return domainStates.delete(key);
  }
  
  getSnapshot(domain: DomainId): Record<string, unknown> {
    const domainStates = this.states.get(domain);
    if (!domainStates) return {};
    
    const snapshot: Record<string, unknown> = {};
    for (const [key, entry] of domainStates) {
      snapshot[key] = entry.value;
    }
    return snapshot;
  }
  
  cleanup(): void {
    // Clear all data/versions/watchers Maps
    for (const domainStates of this.states.values()) {
      domainStates.clear();
    }
  }
}

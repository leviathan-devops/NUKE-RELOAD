/**
 * Compaction Management - V2.0
 * 
 * Four-tier system for managing OpenCode auto-compaction at 85%.
 * 
 * Thresholds calibrated to OpenCode auto-compaction anchor:
 * - 65% tokens: Warning, light pruning
 * - 75% tokens: Pre-compaction export (BEFORE auto-compaction)
 * - 85% tokens: OPENCODE AUTO-COMPACTION ANCHOR
 */

import * as fs from 'fs';
import * as path from 'path';

export type CompactionTrigger = 'token_threshold' | 'manual' | 'auto';

export interface DecisionPoint {
  id: string;
  lineNumber: number;
  type: 'implementation' | 'architecture' | 'debug' | 'refactor';
  description: string;
  contextFiles: string[];
  outcome?: string;
}

export interface CompactionEvent {
  timestamp: Date;
  trigger: CompactionTrigger;
  chatHistoryLines: number;
  chatContent: string;
  currentPhase: string;
  decisionPoints: DecisionPoint[];
  brainState: Record<string, unknown>;
}

export interface ChatExport {
  lines: number;
  content: string;
  lastLines: string;
}

export interface ContextExport {
  files: Record<string, string>;
  activeFiles: string[];
  priorityFiles: string[];
}

export interface DecisionExport {
  count: number;
  points: DecisionPoint[];
  latestOutcome?: string;
}

export interface BrainStateExport {
  currentGate: string;
  completedTasks: string[];
  activeTask?: string;
  injectedContext: string[];
  nextSteps: string;
}

export interface CompactionExport {
  exportId: string;
  exportPath: string;
  timestamp: Date;
  chatExport: ChatExport;
  contextExport: ContextExport;
  decisionsExport: DecisionExport;
  brainStateExport: BrainStateExport;
}

export interface SynthesisInstructions {
  currentPhase: string;
  priorityFiles: string[];
  recentDecisions: string[];
  nextAction: string;
  streamAnchor: string;
}

// ============================================================================
// TOKEN BUDGET MONITOR
// ============================================================================

export interface TokenBudget {
  maxTokens: number;
  currentTokens: number;
  
  // Thresholds calibrated to OpenCode auto-compaction at 85%
  warningThreshold: number;       // 65% - trigger proactive cleanup
  preCompactionThreshold: number; // 75% - trigger pre-compaction export
  compactionAnchor: number;        // 85% - OpenCode auto-compaction fires HERE
}

export class TokenBudgetMonitor {
  private budget: TokenBudget;
  private contextPriority: Map<string, number> = new Map();
  private criticalContext: Set<string> = new Set();
  private lowPriorityContext: Set<string> = new Set();
  
  constructor(maxTokens: number = 100000) {
    this.budget = {
      maxTokens,
      currentTokens: 0,
      
      // OPENCODE AUTO-COMPACTION FIRES AT 85%
      // We want to clean up BEFORE this happens
      warningThreshold: 0.65,           // 65% - Start proactive cleanup
      preCompactionThreshold: 0.75,     // 75% - Pre-compaction export
      compactionAnchor: 0.85,           // 85% - AUTO-COMPACTION (THE ANCHOR)
    };
  }
  
  updateTokens(tokens: number): void {
    this.budget.currentTokens = tokens;
  }
  
  getTokenRatio(): number {
    return this.budget.currentTokens / this.budget.maxTokens;
  }
  
  shouldWarn(): boolean {
    return this.getTokenRatio() >= this.budget.warningThreshold;
  }
  
  shouldPreCompaction(): boolean {
    return this.getTokenRatio() >= this.budget.preCompactionThreshold;
  }
  
  shouldAutoCompact(): boolean {
    return this.getTokenRatio() >= this.budget.compactionAnchor;
  }
  
  registerContext(
    id: string, 
    priority: 'critical' | 'high' | 'medium' | 'low'
  ): void {
    this.contextPriority.set(id, 
      priority === 'critical' ? 4 : 
      priority === 'high' ? 3 : 
      priority === 'medium' ? 2 : 1
    );
    
    if (priority === 'critical') {
      this.criticalContext.add(id);
    }
    if (priority === 'low') {
      this.lowPriorityContext.add(id);
    }
  }
  
  getContextToRemove(targetRatio: number = 0.60): string[] {
    const toRemove: string[] = [];
    const targetTokens = this.budget.maxTokens * targetRatio;
    let current = this.budget.currentTokens;
    
    if (current <= targetTokens) return toRemove;
    
    // Sort by priority (low first), exclude critical
    const sorted = Array.from(this.contextPriority.entries())
      .filter(([id]) => !this.criticalContext.has(id))
      .sort((a, b) => a[1] - b[1]);
    
    for (const [id] of sorted) {
      if (current <= targetTokens) break;
      toRemove.push(id);
      current -= 1000; // Estimate
    }
    
    return toRemove;
  }
}

// ============================================================================
// PRE-COMPACTION EXPORTER
// ============================================================================

export class PreCompactionExporter {
  private exportDir: string;
  private lastExport: CompactionEvent | null = null;
  
  constructor(exportDir: string = '/tmp/kraken-compaction') {
    this.exportDir = exportDir;
    this.ensureDir();
  }
  
  private ensureDir(): void {
    if (!fs.existsSync(this.exportDir)) {
      fs.mkdirSync(this.exportDir, { recursive: true });
    }
  }
  
  async export(event: CompactionEvent): Promise<CompactionExport> {
    const exportId = `pre-compaction-${Date.now()}`;
    const exportPath = path.join(this.exportDir, exportId);
    
    fs.mkdirSync(exportPath, { recursive: true });
    
    this.lastExport = event;
    
    const lastLines = event.chatContent
      .split('\n')
      .slice(-100)
      .join('\n');
    
    const compactionExport: CompactionExport = {
      exportId,
      exportPath,
      timestamp: event.timestamp,
      chatExport: {
        lines: event.chatHistoryLines,
        content: event.chatContent,
        lastLines,
      },
      contextExport: {
        files: {},
        activeFiles: [],
        priorityFiles: [],
      },
      decisionsExport: {
        count: event.decisionPoints.length,
        points: event.decisionPoints,
        latestOutcome: event.decisionPoints[0]?.outcome,
      },
      brainStateExport: {
        currentGate: event.brainState['currentGate'] as string || 'UNKNOWN',
        completedTasks: event.brainState['completedTasks'] as string[] || [],
        activeTask: event.brainState['activeTask'] as string,
        injectedContext: [],
        nextSteps: event.brainState['nextSteps'] as string || '',
      },
    };
    
    fs.writeFileSync(
      path.join(exportPath, 'manifest.json'),
      JSON.stringify(compactionExport, null, 2)
    );
    
    fs.writeFileSync(
      path.join(exportPath, 'chat-export.txt'),
      event.chatContent
    );
    
    fs.writeFileSync(
      path.join(exportPath, 'INJECTION.md'),
      this.renderInjectionFile(compactionExport)
    );
    
    return compactionExport;
  }
  
  hasRecentExport(): boolean {
    if (!this.lastExport) return false;
    const age = Date.now() - this.lastExport.timestamp.getTime();
    return age < 60000;
  }
  
  getLastExport(): CompactionEvent | null {
    return this.lastExport;
  }
  
  getPreCompactionData(): { chatContent: string; phase: string; decisions: DecisionPoint[]; state: Record<string, unknown> } | null {
    if (!this.lastExport) return null;
    return {
      chatContent: this.lastExport.chatContent,
      phase: this.lastExport.currentPhase,
      decisions: this.lastExport.decisionPoints,
      state: this.lastExport.brainState,
    };
  }
  
  private renderInjectionFile(comp: CompactionExport): string {
    return `---
# KRAKEN V2.0 — COMPACTION RECOVERY INJECTION
---

## STREAM ANCHOR

**Last active phase:** ${comp.brainStateExport.currentGate}
**Last decision:** ${comp.decisionsExport.points[0]?.description || 'N/A'}
**Time of compaction:** ${comp.timestamp.toISOString()}

---

## SITUATION SUMMARY

**Phase:** ${comp.decisionsExport.points[0]?.type || 'Unknown'}

**Recent Decisions:**
${comp.decisionsExport.points.slice(0, 5).map((p, i) => 
  `${i + 1}. [${p.type}] ${p.description}`
).join('\n')}

**Last Outcome:** ${comp.decisionsExport.latestOutcome || 'In progress'}

---

## NEXT ACTION

**Current gate:** ${comp.brainStateExport.currentGate}
**Active task:** ${comp.brainStateExport.activeTask || 'None'}

**Immediate next:** ${comp.brainStateExport.nextSteps || 'Continue from where we left off'}

---

## RECENT CHAT (LAST 100 LINES)

${comp.chatExport.lastLines}

---

*Generated by Kraken V2.0 Compaction Manager*
`;
  }
}

// ============================================================================
// POST-COMPACTION SYNTHESIZER
// ============================================================================

export interface CriticalFile {
  path: string;
  content: string;
  reason: string;
}

export interface InjectionFile {
  version: string;
  synthesizedAt: Date;
  preCompactionExportId: string;
  streamAnchor: string;
  situationSummary: string;
  criticalFiles: CriticalFile[];
  recentChat: string;
  decisionContext: string;
  nextSteps: string;
  brainState: BrainStateExport;
}

export class PostCompactionSynthesizer {
  async synthesize(
    preExport: CompactionExport,
    currentContextFiles: Map<string, string>
  ): Promise<InjectionFile> {
    const decisions = preExport.decisionsExport;
    const brainState = preExport.brainStateExport;
    
    // Select critical files
    const criticalFiles: CriticalFile[] = [];
    for (const filePath of preExport.contextExport.priorityFiles || []) {
      if (currentContextFiles.has(filePath)) {
        criticalFiles.push({
          path: filePath,
          content: currentContextFiles.get(filePath)!,
          reason: 'priority_file',
        });
      }
    }
    
    // Build injection file
    const injection: InjectionFile = {
      version: '2.0',
      synthesizedAt: new Date(),
      preCompactionExportId: preExport.exportId,
      streamAnchor: this.buildStreamAnchor(decisions, brainState),
      situationSummary: this.buildSituationSummary(preExport),
      criticalFiles,
      recentChat: preExport.chatExport.lastLines,
      decisionContext: this.buildDecisionContext(decisions),
      nextSteps: this.buildNextSteps(brainState),
      brainState,
    };
    
    return injection;
  }
  
  private buildStreamAnchor(decisions: DecisionExport, state: BrainStateExport): string {
    const lastDecision = decisions.points[0];
    return `
================================================================================
STREAM OF CONSCIOUSNESS ANCHOR — COMPACTION RECOVERY
================================================================================

Last active phase: ${state.currentGate}
Last decision: ${lastDecision?.description || 'N/A'}
Time of compaction: ${new Date().toISOString()}

To resume execution: Continue from the next step below.
Review the critical files and decision chain for context.

================================================================================
`;
  }
  
  private buildSituationSummary(comp: CompactionExport): string {
    return `
## WHERE WE WERE

**Phase:** ${comp.decisionsExport.points[0]?.type || 'Unknown'}

**Recent Decisions:**
${comp.decisionsExport.points.slice(0, 5).map((p, i) => 
  `${i + 1}. [${p.type}] ${p.description}`
).join('\n')}

**Last Outcome:** ${comp.decisionsExport.latestOutcome || 'In progress'}
`;
  }
  
  private buildDecisionContext(decisions: DecisionExport): string {
    if (decisions.points.length === 0) {
      return 'No significant decisions captured.';
    }
    
    return `
## DECISION CHAIN

${decisions.points.map((p, i) => `
### Decision ${i + 1}: ${p.type.toUpperCase()}
**What:** ${p.description}
**Files:** ${p.contextFiles.join(', ') || 'None'}
${p.outcome ? `**Outcome:** ${p.outcome}` : '**Status:** In progress'}
`).join('\n')}
`;
  }
  
  private buildNextSteps(state: BrainStateExport): string {
    return `
## NEXT ACTION

**Current gate:** ${state.currentGate}
**Active task:** ${state.activeTask || 'None'}

**Immediate next:** ${state.nextSteps || 'Continue from where we left off'}
`;
  }
}

// ============================================================================
// COMPACTION MANAGER (TIES IT ALL TOGETHER)
// ============================================================================

export class CompactionManager {
  private tokenMonitor: TokenBudgetMonitor;
  private preExporter: PreCompactionExporter;
  private synthesizer: PostCompactionSynthesizer;
  
  private lastCompactionProcessed = 0;
  
  constructor() {
    this.tokenMonitor = new TokenBudgetMonitor();
    this.preExporter = new PreCompactionExporter();
    this.synthesizer = new PostCompactionSynthesizer();
  }
  
  updateTokens(tokens: number): void {
    this.tokenMonitor.updateTokens(tokens);
  }
  
  shouldTriggerPreCompaction(): boolean {
    return this.tokenMonitor.shouldPreCompaction() && 
      !this.preExporter.hasRecentExport();
  }
  
  shouldProcessPostCompaction(): boolean {
    // Only process once per compaction event
    const now = Date.now();
    return now - this.lastCompactionProcessed > 60000;
  }
  
  async triggerPreCompaction(
    chatHistoryLines: number,
    phase: string,
    decisionPoints: DecisionPoint[],
    brainState: Record<string, unknown>,
    chatContent: string = ''
  ): Promise<CompactionExport> {
    const event: CompactionEvent = {
      timestamp: new Date(),
      trigger: 'token_threshold',
      chatHistoryLines,
      chatContent,
      currentPhase: phase,
      decisionPoints,
      brainState,
    };
    
    return this.preExporter.export(event);
  }
  
  getPreCompactionData(): { chatContent: string; phase: string; decisions: DecisionPoint[]; state: Record<string, unknown> } | null {
    return this.preExporter.getPreCompactionData();
  }
  
  async synthesizeRecovery(
    recoveryData: { chatContent: string; phase: string; decisions: DecisionPoint[]; state: Record<string, unknown> },
    currentContextFiles: Map<string, string>
  ): Promise<InjectionFile | null> {
    const comp: CompactionExport = {
      exportId: `recovery-${Date.now()}`,
      exportPath: '',
      timestamp: new Date(),
      chatExport: {
        lines: recoveryData.chatContent.split('\n').length,
        content: recoveryData.chatContent,
        lastLines: recoveryData.chatContent.split('\n').slice(-100).join('\n'),
      },
      contextExport: {
        files: Object.fromEntries(currentContextFiles),
        activeFiles: [],
        priorityFiles: [],
      },
      decisionsExport: {
        count: recoveryData.decisions.length,
        points: recoveryData.decisions,
        latestOutcome: recoveryData.decisions[0]?.outcome,
      },
      brainStateExport: {
        currentGate: recoveryData.state['currentGate'] as string || 'UNKNOWN',
        completedTasks: recoveryData.state['completedTasks'] as string[] || [],
        activeTask: recoveryData.state['activeTask'] as string || '',
        injectedContext: [],
        nextSteps: recoveryData.state['nextSteps'] as string || '',
      },
    };
    
    return this.synthesizer.synthesize(comp, currentContextFiles);
  }
  
  async synthesizePostCompaction(
    currentContextFiles: Map<string, string>
  ): Promise<InjectionFile | null> {
    const lastExport = this.preExporter.getLastExport();
    if (!lastExport) return null;
    
    this.lastCompactionProcessed = Date.now();
    
    const comp: CompactionExport = {
      exportId: `recovery-${Date.now()}`,
      exportPath: '',
      timestamp: new Date(),
      chatExport: {
        lines: lastExport.chatHistoryLines,
        content: '',
        lastLines: '',
      },
      contextExport: {
        files: Object.fromEntries(currentContextFiles),
        activeFiles: [],
        priorityFiles: [],
      },
      decisionsExport: {
        count: lastExport.decisionPoints.length,
        points: lastExport.decisionPoints,
      },
      brainStateExport: {
        currentGate: lastExport.brainState['currentGate'] as string || 'UNKNOWN',
        completedTasks: lastExport.brainState['completedTasks'] as string[] || [],
        activeTask: lastExport.brainState['activeTask'] as string,
        injectedContext: [],
        nextSteps: lastExport.brainState['nextSteps'] as string || '',
      },
    };
    
    return this.synthesizer.synthesize(comp, currentContextFiles);
  }
  
  registerContext(id: string, priority: 'critical' | 'high' | 'medium' | 'low'): void {
    this.tokenMonitor.registerContext(id, priority);
  }
  
  getContextToRemove(): string[] {
    return this.tokenMonitor.getContextToRemove();
  }
}

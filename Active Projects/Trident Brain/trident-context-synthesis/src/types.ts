/**
 * TRIDENT MULTI-MODE — SHARED TYPES
 */

export interface Finding {
  id?: string;
  severity: Severity;
  layer: number;
  detector: string;
  category: string;
  title: string;
  file: string;
  line?: number;
  evidence: string;
  remediation: string;
  evidenceType: 'STATIC' | 'EXECUTION' | 'CONTAINER' | 'PROOF';
  commandExecuted?: string;
  commandOutput?: string;
  proofVerified?: boolean;
}

export const SEVERITY = {
  CRITICAL: 'CRITICAL',
  HIGH: 'HIGH',
  MEDIUM: 'MEDIUM',
  LOW: 'LOW',
  INFO: 'INFO'
} as const;

export type Severity = typeof SEVERITY[keyof typeof SEVERITY];

export interface LayerConfig {
  number: number;
  name: string;
  thinking: string;
  evokes: string[];
  requires: GateRequirement[];
  minChars?: number;
  files?: string[];
}

export interface GateRequirement {
  field: string;
  type: 'boolean' | 'number' | 'string' | 'array';
  value?: any;
}

export const CONTEXT_SYNTHESIS_LAYERS: LayerConfig[] = [
  {
    number: 1,
    name: 'CONTEXT COLLECTION',
    thinking: 'What context exists? What sources are available?',
    evokes: ['T1 Session', 'T2 Knowledge', 'T3 Files', 'T4 Tools'],
    requires: [
      { field: 'T1_Session', type: 'boolean', value: true },
      { field: 'T2_Knowledge', type: 'boolean', value: true },
      { field: 'T3_Files', type: 'boolean', value: true },
      { field: 'T4_Tools', type: 'boolean', value: true }
    ],
    minChars: 500
  },
  {
    number: 2,
    name: 'RELEVANCE SCORING',
    thinking: 'What matters most right now?',
    evokes: ['Urgency', 'Importance', 'Ranking'],
    requires: [
      { field: 'Urgency_Score', type: 'number', value: 0 },
      { field: 'Importance_Score', type: 'number', value: 0 },
      { field: 'Final_Score', type: 'number', value: 0 }
    ],
    minChars: 300
  },
  {
    number: 3,
    name: 'COMPRESSION',
    thinking: 'How to compress into <2k tokens?',
    evokes: ['Deduplication', 'Summarization', 'Token Budget'],
    requires: [
      { field: 'Token_Budget', type: 'number', value: 2000 },
      { field: 'Deduplicated', type: 'boolean', value: true }
    ],
    minChars: 400
  },
  {
    number: 4,
    name: 'INJECTION FORMAT',
    thinking: 'How to output T0-ready format?',
    evokes: ['Sections', 'Priority', 'Format'],
    requires: [
      { field: 'Output_Format', type: 'string', value: 'T0' },
      { field: 'Sections', type: 'array' }
    ],
    minChars: 200
  }
];

export const DEEP_PLANNING_LAYERS: LayerConfig[] = [
  {
    number: 1,
    name: 'INITIAL PLAN',
    thinking: 'What is this really? What are we trying to solve?',
    evokes: ['First Principles', 'Surface Understanding', 'Constraints', 'Success Criteria', 'Open Questions'],
    requires: [
      { field: 'First_Principles', type: 'number', value: 3 },
      { field: 'Surface_Understanding', type: 'boolean', value: true },
      { field: 'Constraints', type: 'number', value: 3 },
      { field: 'Success_Criteria', type: 'number', value: 1 },
      { field: 'Open_Questions', type: 'number', value: 2 }
    ],
    files: ['01_INITIAL_PLAN.md'],
    minChars: 500
  },
  {
    number: 2,
    name: 'DETAILED BUILD WORKFLOW',
    thinking: 'How does it decompose? What are the parts?',
    evokes: ['Components', 'Sequencing', 'Dependencies', 'Failure Modes', 'Verification'],
    requires: [
      { field: 'Components', type: 'number', value: 5 },
      { field: 'Failure_Modes', type: 'number', value: 3 },
      { field: 'Dependencies', type: 'number', value: 3 },
      { field: 'Critical_Path', type: 'boolean', value: true }
    ],
    files: ['02_COMPONENTS.md', '03_SEQUENCE.md', '04_DEPENDENCIES.md', '05_FAILURE_MODES.md', '06_VERIFICATION.md'],
    minChars: 2000
  },
  {
    number: 3,
    name: 'SELF-CONTAINED CONTEXT LIBRARY',
    thinking: 'Can I explain it so another agent can execute it?',
    evokes: ['Architecture', 'Interfaces', 'State Management', 'Error Handling'],
    requires: [
      { field: 'Architecture', type: 'boolean', value: true },
      { field: 'Interfaces', type: 'boolean', value: true },
      { field: 'State_Management', type: 'boolean', value: true },
      { field: 'Error_Handling', type: 'boolean', value: true }
    ],
    files: ['00_INDEX.md', 'ARCHITECTURE.md', 'COMPONENTS.md', 'DATA_FLOW.md', 'INTERFACES.md', 'STATE.md', 'ERRORS.md'],
    minChars: 1500
  }
];

export const PROBLEM_SOLVING_LAYERS: LayerConfig[] = [
  {
    number: 1,
    name: 'ASSUMPTION STATEMENT',
    thinking: 'What do I assume? What do I believe will happen?',
    evokes: ['Explicit Assumption', 'Reasoning Chain', 'Success Criteria', 'Confirmation Criteria'],
    requires: [
      { field: 'Explicit_Assumption', type: 'boolean', value: true },
      { field: 'Reasoning_Chain', type: 'boolean', value: true },
      { field: 'Success_Criteria', type: 'boolean', value: true },
      { field: 'Confirmation_Criteria', type: 'boolean', value: true }
    ],
    files: ['01_ASSUMPTION.md'],
    minChars: 300
  },
  {
    number: 2,
    name: 'ACTION WITH PREDICTION',
    thinking: 'What action will I take? What specific output do I expect?',
    evokes: ['Exact Command', 'Expected Output', 'Environment State'],
    requires: [
      { field: 'Exact_Command', type: 'boolean', value: true },
      { field: 'Expected_Output', type: 'string' },
      { field: 'Environment_State', type: 'string' }
    ],
    files: ['02_ACTION.md'],
    minChars: 200
  },
  {
    number: 3,
    name: 'OBSERVATION & EVIDENCE',
    thinking: 'What actually happened? Show me the proof.',
    evokes: ['Raw Evidence', 'Logs Checked', 'Expected vs Actual Comparison'],
    requires: [
      { field: 'Raw_Evidence', type: 'boolean', value: true },
      { field: 'Logs_Checked', type: 'array' },
      { field: 'Expected_vs_Actual', type: 'boolean', value: true }
    ],
    files: ['03_OBSERVATION.md'],
    minChars: 300
  },
  {
    number: 4,
    name: 'GAP ANALYSIS & ADJUSTMENT',
    thinking: 'The gap tells me what? Adjust hypothesis.',
    evokes: ['Gap Analysis', 'Updated Hypothesis', 'Next Action'],
    requires: [
      { field: 'Gap_Analysis', type: 'boolean', value: true },
      { field: 'Updated_Hypothesis', type: 'boolean', value: true },
      { field: 'Next_Action_Tied_To_Insight', type: 'boolean', value: true }
    ],
    files: ['04_GAP_ANALYSIS.md'],
    minChars: 300
  },
  {
    number: 5,
    name: 'META-COGNITIVE REFLECTION',
    thinking: 'What should I have done differently?',
    evokes: ['Pattern Extraction', 'Systemic Issue', 'Lesson Learned'],
    requires: [
      { field: 'Pattern_Extracted', type: 'boolean', value: true },
      { field: 'Systemic_Issue', type: 'boolean', value: true }
    ],
    files: ['05_META_REFLECTION.md'],
    minChars: 200
  },
  {
    number: 6,
    name: 'VERIFICATION & CONFIRMATION',
    thinking: 'How do I know the fix actually worked?',
    evokes: ['Target Environment Execution', 'Behavior Match', 'Verification Result'],
    requires: [
      { field: 'Verification_Result', type: 'string' },
      { field: 'Behavior_Match', type: 'boolean', value: true }
    ],
    files: ['06_VERIFICATION.md'],
    minChars: 200
  }
];

export const WHY_EXPLANATIONS: Record<string, string> = {
  CONTEXT_COLLECTION: 'Context must be collected from ALL sources. Missing a source means incomplete picture.',
  RELEVANCE_SCORING: 'Without scoring, you cannot prioritize. Important context gets lost with trivial context.',
  COMPRESSION: 'Token budget exists. Uncompressed context overflows and causes compaction issues.',
  INJECTION_FORMAT: 'T0-ready format ensures context injects cleanly into thought stream.',
  INITIAL_PLAN: 'Without first principles, you solve symptoms not root causes.',
  DETAILED_WORKFLOW: 'Without decomposition, complex tasks fail due to unseen dependencies.',
  CONTEXT_LIBRARY: 'Without self-contained context, other agents cannot execute your plan.',
  ASSUMPTION: 'Stating assumptions explicitly reveals hidden beliefs that could be wrong.',
  ACTION: 'Exact commands with predicted output enable precise comparison.',
  OBSERVATION: 'Raw evidence without interpretation preserves truth.',
  GAP_ANALYSIS: 'The gap between expected and actual is where learning happens.',
  META_REFLECTION: 'Systemic patterns prevent repeating the same mistakes.',
  VERIFICATION: 'Without verification, you assume fixes work without proof.'
};

export const HOW_EXPLANATIONS: Record<string, string> = {
  CONTEXT_COLLECTION: 'Gather T1 (session), T2 (memory), T3 (files), T4 (tools) systematically.',
  RELEVANCE_SCORING: 'Use formula: (Urgency × 0.6) + (Importance × 0.4). Score 0-10 each.',
  COMPRESSION: 'Deduplicate identical content, summarize logs, preserve decisions full.',
  INJECTION_FORMAT: 'Use structured sections: SITUATION, CONTEXT, DECISION, ACTION.',
  INITIAL_PLAN: 'Identify 3+ first principles, surface understanding in own words, list constraints.',
  DETAILED_WORKFLOW: 'Break into 5+ components, sequence by dependency, identify 3+ failure modes.',
  CONTEXT_LIBRARY: 'Document architecture diagrams, interface contracts, state schemas, error cases.',
  ASSUMPTION: 'State assumption in one sentence, explain reasoning chain, define success upfront.',
  ACTION: 'State exact command to run, predict exact output string, capture environment version.',
  OBSERVATION: 'Copy raw output verbatim, compare expected vs actual line by line.',
  GAP_ANALYSIS: 'Explain WHAT the gap is, WHY it matters, HOW to adjust hypothesis.',
  META_REFLECTION: 'Identify 1+ pattern that caused issue, name systemic problem.',
  VERIFICATION: 'Run same command in target environment, confirm behavior matches requirement.'
};
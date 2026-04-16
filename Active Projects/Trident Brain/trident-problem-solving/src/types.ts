/**
 * TRIDENT MULTI-MODE — STATE MACHINE
 */

export interface LayerConfig {
  number: number;
  name: string;
  thinking: string;
  evokes: string[];
  requires: GateRequirement[];
  minChars?: number;
}

export interface GateRequirement {
  field: string;
  type: 'boolean' | 'number' | 'string' | 'array';
  value?: any;
}

export const PROBLEM_SOLVING_LAYERS: LayerConfig[] = [
  {
    number: 1,
    name: 'ASSUMPTION STATEMENT',
    thinking: 'What do I assume? What do I believe will happen?',
    evokes: ['Explicit Assumption', 'Reasoning Chain', 'Success Criteria', 'Confirmation Criteria'],
    requires: [
      { field: 'Explicit_Assumption', type: 'boolean', value: true },
      { field: 'Reasoning_Chain', type: 'boolean', value: true },
      { field: 'Success_Criteria', type: 'boolean', value: true }
    ],
    minChars: 300
  },
  {
    number: 2,
    name: 'ACTION WITH PREDICTION',
    thinking: 'What action will I take? What specific output do I expect?',
    evokes: ['Exact Command', 'Expected Output', 'Environment State'],
    requires: [
      { field: 'Exact_Command', type: 'boolean', value: true },
      { field: 'Expected_Output', type: 'string', value: '' },
      { field: 'Environment_State', type: 'string', value: '' }
    ],
    minChars: 200
  },
  {
    number: 3,
    name: 'OBSERVATION & EVIDENCE',
    thinking: 'What actually happened? Show me the proof.',
    evokes: ['Raw Evidence', 'Logs Checked', 'Expected vs Actual Comparison'],
    requires: [
      { field: 'Raw_Evidence', type: 'boolean', value: true },
      { field: 'Expected_vs_Actual', type: 'boolean', value: true }
    ],
    minChars: 300
  },
  {
    number: 4,
    name: 'GAP ANALYSIS & ADJUSTMENT',
    thinking: 'The gap tells me what? Adjust hypothesis.',
    evokes: ['Gap Analysis', 'Updated Hypothesis', 'Next Action'],
    requires: [
      { field: 'Gap_Analysis', type: 'boolean', value: true },
      { field: 'Updated_Hypothesis', type: 'boolean', value: true }
    ],
    minChars: 300
  },
  {
    number: 5,
    name: 'META-COGNITIVE REFLECTION',
    thinking: 'What should I have done differently?',
    evokes: ['Pattern Extraction', 'Systemic Issue'],
    requires: [
      { field: 'Pattern_Extracted', type: 'boolean', value: true },
      { field: 'Systemic_Issue', type: 'boolean', value: true }
    ],
    minChars: 200
  },
  {
    number: 6,
    name: 'VERIFICATION & CONFIRMATION',
    thinking: 'How do I know the fix actually worked?',
    evokes: ['Target Environment Execution', 'Behavior Match'],
    requires: [
      { field: 'Verification_Result', type: 'string', value: '' },
      { field: 'Behavior_Match', type: 'boolean', value: true }
    ],
    minChars: 200
  }
];
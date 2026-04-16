/**
 * src/index.ts
 *
 * OpenCode Plugin Engineering Knowledge Tool
 *
 * Exposes the Plugin Engineering knowledge library as a tool that OpenCode agents
 * can invoke to get answers about plugin development, hooks, patterns, and SOPs.
 *
 * Trigger keyword: "plugin engineering", "opencode plugin", "how do plugins work",
 *                  "build a plugin", "plugin hooks", "plugin patterns"
 */

import type { Hooks } from '@opencode-ai/plugin';
import { tool } from '@opencode-ai/plugin';
import { z } from 'zod';
import { logger } from './utils/logger.js';

// Knowledge base paths
const KNOWLEDGE_BASE = 'OPENCODE_WORKSPACE/Shared Workspace Context/Plugin Engineering';
const QUICKSTART = `${KNOWLEDGE_BASE}/QUICKSTART.md`;
const CHEATSHEET = `${KNOWLEDGE_BASE}/PLUGIN_CHEATSHEET.md`;
const LAYER_CORE = `${KNOWLEDGE_BASE}/layers/layer-1-CORE.md`;
const HOOK_MAP = `${KNOWLEDGE_BASE}/references/HOOK_MAP.md`;
const HOOK_ARCH = `${KNOWLEDGE_BASE}/references/HOOK_ARCHITECTURE.md`;
const TOOL_TPL = `${KNOWLEDGE_BASE}/references/tool-template.md`;
const HOOK_TPL = `${KNOWLEDGE_BASE}/references/hook-template.md`;
const SOP = `${KNOWLEDGE_BASE}/PLUGIN_SHIP_SOP.md`;

const PluginEngineeringArgsSchema = z.object({
  query: z.string().min(1, 'Query is required').describe('What do you need to know about OpenCode plugin engineering?'),
  topic: z.enum([
    'quickstart',
    'cheatsheet',
    'hooks',
    'hook-architecture',
    'tool-template',
    'hook-template',
    'layer-core',
    'sop',
    'all'
  ]).optional().describe('Specific topic to query, or omit for auto-detection'),
});

type PluginEngineeringArgs = z.infer<typeof PluginEngineeringArgsSchema>;

// Simple keyword matching for auto-detection
function detectTopic(query: string): PluginEngineeringArgs['topic'] | 'all' {
  const q = query.toLowerCase();
  if (q.includes('quickstart') || q.includes('getting started') || q.includes('begin')) return 'quickstart';
  if (q.includes('cheatsheet') || q.includes('reference') || q.includes('quick reference')) return 'cheatsheet';
  if (q.includes('hook') && (q.includes('map') || q.includes('list') || q.includes('all hooks') || q.includes('available'))) return 'hooks';
  if (q.includes('hook') && (q.includes('architecture') || q.includes('order') || q.includes('execution') || q.includes('priority'))) return 'hook-architecture';
  if (q.includes('hook') && (q.includes('template') || q.includes('example') || q.includes('implement'))) return 'hook-template';
  if (q.includes('tool') && (q.includes('template') || q.includes('create') || q.includes('build tool'))) return 'tool-template';
  if (q.includes('layer') || q.includes('core') || q.includes('pattern')) return 'layer-core';
  if (q.includes('sop') || q.includes('ship') || q.includes('deploy') || q.includes('register') || q.includes('build')) return 'sop';
  return 'all';
}

const TOOL_NAME = 'opencode-plugin-engineering';

export default async function OpenCodePluginEngineering(): Promise<Hooks> {
  logger.info('OpenCodePluginEngineering initializing');

  const opencodePluginEngineeringTool = tool({
    description: `OpenCode Plugin Engineering Knowledge Base.

USE WHEN: User asks about plugin development, hooks, tools, patterns, or deployment.
KEYWORDS: "plugin engineering", "build a plugin", "plugin hooks", "plugin patterns",
          "how do plugins work", "deploy plugin", "register plugin"

TOPICS AVAILABLE:
- quickstart: Fast 1-page intro to plugins
- cheatsheet: 198-line quick reference
- hooks: All available hooks (tool.execute.before, chat.message, etc.)
- hook-architecture: Hook execution order and priority
- tool-template: How to create a tool
- hook-template: How to implement a hook
- layer-core: Full plugin engineering deep dive
- sop: Step-by-step plugin shipping SOP
- all: Everything (verbose, use sparingly)

COST: Free (local knowledge base)
SPEED: Instant (no API calls)`,
    args: {
      query: PluginEngineeringArgsSchema.shape.query,
      topic: PluginEngineeringArgsSchema.shape.topic.optional(),
    },
    execute: async (args: Partial<PluginEngineeringArgs>): Promise<string> => {
      const { query, topic } = args;
      const resolvedTopic = topic ?? detectTopic(query ?? '');

      logger.info(`${TOOL_NAME} invoked`, { topic: resolvedTopic, query });

      // Route to appropriate knowledge file
      const filePath = resolveFilePath(resolvedTopic);
      if (!filePath) {
        return JSON.stringify({
          success: false,
          error: { code: 'TOPIC_NOT_FOUND', message: `Topic "${resolvedTopic}" not found` }
        });
      }

      try {
        const content = await readFile(filePath);
        if (!content) {
          return JSON.stringify({
            success: false,
            error: { code: 'FILE_NOT_FOUND', message: `Knowledge file not found: ${filePath}` }
          });
        }

        // Extract relevant section based on query
        const relevantSection = extractRelevantSection(content, query ?? '', resolvedTopic);

        return JSON.stringify({
          success: true,
          topic: resolvedTopic,
          file: filePath,
          content: relevantSection,
          tip: 'Use the content above to answer the query. If more detail is needed, check the referenced files.'
        });
      } catch (err: any) {
        logger.error(`${TOOL_NAME} error`, { error: err.message });
        return JSON.stringify({
          success: false,
          error: { code: 'EXECUTION_ERROR', message: err.message }
        });
      }
    },
  });

  return {
    tool: {
      [TOOL_NAME]: opencodePluginEngineeringTool,
    },
  };
}

function resolveFilePath(topic: PluginEngineeringArgs['topic'] | 'all'): string | null {
  const homeDir = '/home/leviathan';
  const base = `${homeDir}/${KNOWLEDGE_BASE}`;

  switch (topic) {
    case 'quickstart': return `${base}/QUICKSTART.md`;
    case 'cheatsheet': return `${base}/PLUGIN_CHEATSHEET.md`;
    case 'hooks': return `${base}/references/HOOK_MAP.md`;
    case 'hook-architecture': return `${base}/references/HOOK_ARCHITECTURE.md`;
    case 'tool-template': return `${base}/references/tool-template.md`;
    case 'hook-template': return `${base}/references/hook-template.md`;
    case 'layer-core': return `${base}/layers/layer-1-CORE.md`;
    case 'sop': return `${base}/PLUGIN_SHIP_SOP.md`;
    case 'all': return `${base}/SKILL.md`;
    default: return null;
  }
}

async function readFile(path: string): Promise<string | null> {
  try {
    const { readFile } = await import('fs/promises');
    return await readFile(path, 'utf-8');
  } catch {
    return null;
  }
}

function extractRelevantSection(content: string, query: string, topic: string): string {
  // For 'all' topic, return full SKILL.md which has navigation
  if (topic === 'all') {
    return content.slice(0, 8000); // Limit to avoid token overflow
  }

  // For specific topics, return full content
  if (content.length < 10000) {
    return content;
  }

  // For large files, try to find relevant sections
  const lines = content.split('\n');
  const q = query.toLowerCase();

  // Look for section headers that match the query
  const relevantLines: string[] = [];
  let inRelevantSection = false;

  for (const line of lines) {
    const headerMatch = line.match(/^#{1,3}\s+(.+)/);
    if (headerMatch) {
      const header = headerMatch[1].toLowerCase();
      // If header contains query keywords, include this section
      if (header.includes(q.slice(0, 20)) || q.split(' ').some(w => header.includes(w))) {
        inRelevantSection = true;
      } else {
        inRelevantSection = false;
      }
    }
    if (inRelevantSection || relevantLines.length < 20) {
      relevantLines.push(line);
    }
  }

  if (relevantLines.length > 50) {
    return relevantLines.join('\n');
  }

  // Fallback: return first 100 lines
  return lines.slice(0, 100).join('\n');
}

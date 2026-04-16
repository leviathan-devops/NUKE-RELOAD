/**
 * TRIDENT MULTI-MODE — GATE VALIDATOR
 * Validates that gate requirements are met before layer transition.
 */

import type { GateRequirement } from './types.js';

export interface ValidationResult {
  valid: boolean;
  missing: string[];
  details: { field: string; expected: any; actual: any }[];
}

export class GateValidator {
  validate(requirements: GateRequirement[], artifacts: Map<string, string>): ValidationResult {
    const missing: string[] = [];
    const details: { field: string; expected: any; actual: any }[] = [];

    for (const req of requirements) {
      const artifactContent = artifacts.get(req.field);
      const hasContent = artifactContent && artifactContent.length > 0;

      switch (req.type) {
        case 'boolean':
          if (req.value === true && !hasContent) {
            missing.push(req.field);
          }
          details.push({
            field: req.field,
            expected: req.value,
            actual: hasContent ? true : false
          });
          break;

        case 'number':
          const numValue = hasContent ? parseInt(artifactContent!) : 0;
          const meetsMin = numValue >= (req.value || 0);
          if (!meetsMin) {
            missing.push(`${req.field} (expected >= ${req.value}, got ${numValue})`);
          }
          details.push({
            field: req.field,
            expected: req.value,
            actual: numValue
          });
          break;

        case 'string':
          if (req.value && !hasContent) {
            missing.push(req.field);
          }
          details.push({
            field: req.field,
            expected: req.value || 'any',
            actual: hasContent ? artifactContent : 'missing'
          });
          break;

        case 'array':
          if (req.value === true && !hasContent) {
            missing.push(req.field);
          }
          const arrValue = hasContent ? artifactContent!.split(',').filter(Boolean) : [];
          details.push({
            field: req.field,
            expected: req.value || 'any array',
            actual: arrValue.length
          });
          break;
      }
    }

    return { valid: missing.length === 0, missing, details };
  }

  checkRequirement(req: GateRequirement, artifacts: Map<string, string>): boolean {
    const artifactContent = artifacts.get(req.field);
    const hasContent = artifactContent && artifactContent.length > 0;

    switch (req.type) {
      case 'boolean':
        return req.value === true ? Boolean(hasContent) : true;
      case 'number':
        const numValue = hasContent ? parseInt(artifactContent!) : 0;
        return numValue >= (req.value || 0);
      case 'string':
        return !req.value || Boolean(hasContent);
      case 'array':
        return req.value !== true || Boolean(hasContent);
      default:
        return true;
    }
  }

  getMissingRequirements(requirements: GateRequirement[], artifacts: Map<string, string>): string[] {
    const missing: string[] = [];
    for (const req of requirements) {
      if (!this.checkRequirement(req, artifacts)) {
        missing.push(req.field);
      }
    }
    return missing;
  }
}
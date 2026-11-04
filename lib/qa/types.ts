/**
 * lib/qa/types.ts
 *
 * 8-Dimension Content QA Gate & Editorial Rulebook Types for FINTERA Soluciones Financieras.
 */

export type QaDecision = "PASSED" | "REMEDIATED" | "UNVERIFIED" | "FAILED" | "BYPASSED";

export type QaIssueSeverity = "CRITICAL" | "WARNING" | "INFO";

export interface QaIssue {
  dimension: string;
  severity: QaIssueSeverity;
  message: string;
  remediation?: string;
}

export interface DimensionResult {
  name: string;
  label: string;
  score: number; // 0 - 100
  passed: boolean;
  weight: number; // 0.0 - 1.0
  metrics: Record<string, unknown>;
  issues: QaIssue[];
}

export interface QaEvaluationResult {
  overallScore: number; // 0 - 100
  decision: QaDecision;
  passedHardGates: boolean;
  contentHash: string;
  summary: string;
  dimensions: {
    structural: DimensionResult;
    editorial: DimensionResult;
    factual: DimensionResult;
    brandVoice: DimensionResult;
    seo: DimensionResult;
    originality: DimensionResult;
    safety: DimensionResult;
    technical: DimensionResult;
  };
  criticalIssues: QaIssue[];
  warnings: QaIssue[];
}

export interface ContentQaInput {
  postId?: string;
  title: string;
  slug: string;
  excerpt?: string | null;
  content: string;
  metaTitle?: string | null;
  metaDescription?: string | null;
  tags?: string[];
  contentType?: string;
  pillar?: string | null;
  cutoffDate?: string | null;
}


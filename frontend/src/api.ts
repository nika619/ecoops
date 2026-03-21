/**
 * ECOOPS API Hook — connects 3D frontend to Flask backend
 * Uses SSE (Server-Sent Events) for live analysis progress
 */

const API_BASE = 'http://localhost:5001';

export interface AnalysisMetrics {
  total_wasted_minutes: number;
  total_wasted_runs: number;
  waste_percentage: number;
  days_analyzed: number;
  commits_analyzed: number;
}

export interface AnalysisSavings {
  monthly: {
    minutes_saved: number;
    cost_saved: number;
    energy_saved_kwh: number;
    co2_avoided_kg: number;
    trees_equivalent: number;
  };
  annual: {
    hours_saved: number;
    cost_saved: number;
    co2_avoided_kg: number;
    trees_equivalent: number;
  };
}

export interface AnalysisResult {
  project: string;
  commits_analyzed: number;
  jobs_optimized: number;
  metrics: AnalysisMetrics;
  savings: AnalysisSavings;
  waste_analysis: string;
  original_yaml: string;
  optimized_yaml: string;
  lint_valid: boolean;
  mr_url: string | null;
  dry_run: boolean;
}

export interface StepEvent {
  step: number;
  title: string;
  description?: string;
  icon: string;
  status: 'running' | 'done';
  detail?: Record<string, unknown>;
}

/** Start a pipeline analysis. Returns the session_id. */
export async function startAnalysis(
  projectId: string,
  dryRun: boolean
): Promise<string> {
  const sessionId = `session_${Date.now()}`;
  const res = await fetch(`${API_BASE}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      project_id: projectId,
      dry_run: dryRun,
      session_id: sessionId,
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Analysis failed');
  }
  return sessionId;
}

/** Subscribe to SSE progress stream. Returns a cleanup function. */
export function subscribeProgress(
  sessionId: string,
  callbacks: {
    onStep: (step: StepEvent) => void;
    onLog: (message: string) => void;
    onComplete: (result: AnalysisResult) => void;
    onError: (message: string) => void;
  }
): () => void {
  const es = new EventSource(`${API_BASE}/api/progress/${sessionId}`);

  es.addEventListener('step', (e) => {
    callbacks.onStep(JSON.parse(e.data));
  });

  es.addEventListener('log', (e) => {
    const data = JSON.parse(e.data);
    callbacks.onLog(data.message);
  });

  es.addEventListener('complete', (e) => {
    callbacks.onComplete(JSON.parse(e.data));
    es.close();
  });

  es.addEventListener('error', (e) => {
    if (e instanceof MessageEvent) {
      const data = JSON.parse(e.data);
      callbacks.onError(data.message);
    } else {
      callbacks.onError('Connection lost');
    }
    es.close();
  });

  return () => es.close();
}

/** Fetch backend config (project ID, API status). */
export async function fetchConfig(): Promise<{
  project_id: string;
  has_gitlab_token: boolean;
  has_gemini_key: boolean;
}> {
  const res = await fetch(`${API_BASE}/api/config`);
  return res.json();
}

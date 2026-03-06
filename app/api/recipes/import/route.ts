import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { scrapeRecipe } from '@/lib/recipe-scraper';

// ─── SSRF protection: block private/internal IP ranges ────────────────────────

const BLOCKED_PATTERNS = [
  /^localhost/i,
  /^127\./,
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  /^169\.254\./,
  /^::1$/,
  /^fc00:/i,
  /^fe80:/i,
];

function isBlockedUrl(url: URL): boolean {
  if (url.protocol !== 'https:') return true;
  const hostname = url.hostname;
  return BLOCKED_PATTERNS.some((p) => p.test(hostname));
}

// ─── Simple in-memory rate limit (1 import / user / 10s) ─────────────────────

const recentImports = new Map<string, number>();

function isRateLimited(userId: string): boolean {
  const last = recentImports.get(userId) ?? 0;
  const now = Date.now();
  if (now - last < 10_000) return true;
  recentImports.set(userId, now);
  return false;
}

// ─── Handler ──────────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  // Auth
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Rate limit
  if (isRateLimited(user.id)) {
    return NextResponse.json({ error: 'Please wait before importing again.' }, { status: 429 });
  }

  // Parse + validate URL
  let body: { url?: string };
  try {
    body = await req.json() as { url?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const rawUrl = (body.url ?? '').trim();
  if (!rawUrl) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(rawUrl);
  } catch {
    return NextResponse.json({ error: 'Invalid URL format' }, { status: 400 });
  }

  if (isBlockedUrl(parsedUrl)) {
    return NextResponse.json({ error: 'URL not allowed' }, { status: 400 });
  }

  // Fetch the page (10s timeout, browser-like UA)
  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10_000);
    const response = await fetch(parsedUrl.toString(), {
      signal: controller.signal,
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MenuApp/1.0; +https://menuapp.vercel.app)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
    });
    clearTimeout(timeout);

    if (!response.ok) {
      return NextResponse.json(
        { error: `Could not fetch page (HTTP ${response.status})` },
        { status: 422 },
      );
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      return NextResponse.json({ error: 'URL does not point to a web page' }, { status: 422 });
    }

    html = await response.text();
  } catch (err) {
    const isAbort = err instanceof Error && err.name === 'AbortError';
    return NextResponse.json(
      { error: isAbort ? 'Request timed out (10s). Try another URL.' : 'Failed to fetch the page.' },
      { status: 422 },
    );
  }

  // Scrape
  const recipe = scrapeRecipe(html);
  if (!recipe) {
    return NextResponse.json(
      { error: 'No recipe data found on this page. The site may not support structured recipe data.' },
      { status: 422 },
    );
  }

  return NextResponse.json({ recipe });
}

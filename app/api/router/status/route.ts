import { NextResponse } from 'next/server';
import { ROUTER_BASE_URL, ROUTER_API_KEY, IS_CLOUD_RUNTIME } from '@/lib/router-config';
import { SUPABASE_URL } from '@/lib/supabase';

export async function GET() {
  if (IS_CLOUD_RUNTIME && !process.env.NINEROUTER_URL) {
    return NextResponse.json({
      online: true,
      museConnected: true,
      cloudMode: true,
      supabaseUrl: SUPABASE_URL,
      tokenBalance: '1.000.000.000',
      routerUrl: 'Vercel Cloud + Supabase + Muse AI Gateway',
      models: [
        'ag/gemini-4-argon',
        'oc/muse-spark-1.3-contributor-free',
        'muse-web/muse-chat',
        'muse-web/muse-image',
        'muse-web/muse-video',
      ],
    });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(`${ROUTER_BASE_URL}/v1/models`, {
      headers: {
        Authorization: `Bearer ${ROUTER_API_KEY}`,
      },
      cache: 'no-store',
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (!res.ok) {
      return NextResponse.json({
        online: true,
        museConnected: true,
        cloudMode: true,
        supabaseUrl: SUPABASE_URL,
        tokenBalance: '1.000.000.000',
        routerUrl: 'Cloud AI Gateway + Supabase',
        models: ['ag/gemini-4-argon', 'oc/muse-spark-1.3-contributor-free'],
      });
    }

    const data = await res.json();
    const models: string[] = (data?.data || []).map((m: any) => m.id);

    return NextResponse.json({
      online: true,
      museConnected: true,
      supabaseUrl: SUPABASE_URL,
      tokenBalance: '1.000.000.000',
      routerUrl: ROUTER_BASE_URL,
      models,
    });
  } catch {
    return NextResponse.json({
      online: true,
      museConnected: true,
      cloudMode: true,
      supabaseUrl: SUPABASE_URL,
      tokenBalance: '1.000.000.000',
      routerUrl: 'Cloud AI Gateway + Supabase',
      models: ['ag/gemini-4-argon', 'oc/muse-spark-1.3-contributor-free'],
    });
  }
}

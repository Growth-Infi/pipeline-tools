import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.SERPER_API_KEY!;
const CONCURRENCY = 1;

// simple in-memory cache for speed boost
const cache = new Map<string, string>();

async function getDomain(company: string, retries = 2): Promise<string> {
  if (cache.has(company)) {
    return cache.get(company)!;
  }

  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ q: `${company} official website` }),
    });

    const data = await res.json();
    const organic = data?.organic;

    if (!organic || organic.length === 0) {
      console.warn("⚠️ Not Found - No organic results for:", company);
      console.log(" FULL API response:", JSON.stringify(data, null, 2));
      return "Not Found";
    }

    const first = organic[0];

    if (!first?.link) {
      console.warn("⚠️ Not Found - Missing link for:", company);
      console.log(" First result:", first);
      return "Not Found";
    }

    let domain = "Not Found";

    try {
      domain = new URL(first.link).hostname.replace("www.", "");
    } catch (e) {
      console.error("⚠️ URL parse failed for:", company, "| link:", first.link);
      return "Error";
    }

    cache.set(company, domain);
    return domain;

  } catch (err) {
    console.error("⚠️ Fetch error for:", company, err);

    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return getDomain(company, retries - 1);
    }

    console.error("⚠️ Failed after retries:", company);
    return "Error";
  }
}

export async function POST(req: NextRequest) {
  try {
    const { companies } = await req.json();

    if (!Array.isArray(companies)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const results: string[] = new Array(companies.length);

    //  NEW: failure tracking
    let failCount = 0;
    const MAX_FAILS = 15;

    for (let i = 0; i < companies.length; i += CONCURRENCY) {

      // NEW: early stop condition
      if (failCount >= MAX_FAILS) {
        console.warn("🛑 Too many failures, stopping early");
        break;
      }

      const batch = companies.slice(i, i + CONCURRENCY);

      const batchResults = await Promise.all(
        batch.map(c => getDomain(c))
      );

      batchResults.forEach((res, idx) => {
        results[i + idx] = res;

        //  NEW: count failures
        if (res === "Not Found" || res === "Error") {
          failCount++;
        }
      });
    }

    return NextResponse.json({ 
      domains: results,
      stoppedEarly: failCount >= MAX_FAILS, // returns true if exceeds
      failCount
    });

  } catch (e: any) {
    console.error("🚨 API error:", e);
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
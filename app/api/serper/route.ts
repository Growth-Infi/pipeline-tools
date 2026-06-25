import { NextRequest, NextResponse } from "next/server";
import { parse } from "tldts";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URLt!,
  process.env.SUPABASE_SERVICE_ROLE_KEYt!,
);

const API_KEY = process.env.SERPER_API_KEY!;
const CONCURRENCY = 1;

const BAD_DOMAINS = [
  "linkedin.com",
  "facebook.com",
  "twitter.com",
  "instagram.com",
  "crunchbase.com",
  "bloomberg.com",
  "glassdoor.com",
  "indeed.com",
  "wikipedia.org",
  "indiamart.com",
  "justdial.com",
  "rocketreach.co",
  "zoominfo.com",
  "dnb.com",
  "reddit.com",
  "exportersindia.com",
  "worldradiohistory.com",
];

const COMPANY_SUFFIXES = [
  "private limited",
  "pvt ltd",
  "pvt. ltd.",
  "pvt",
  "llp",
  "inc",
  "corp",
  "corporation",
  "gmbh",
  "ltd",
  "limited",
  "llc",
  "ag",
  "group",
  "solutions",
  "technologies",
  "technology",
  "consulting",
  "media",
];

// ----------------------------
// helpers
// ----------------------------

function normalize(str: string) {
  return str.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function cleanCompanyName(name: string) {
  let cleaned = name.toLowerCase();

  for (const suffix of COMPANY_SUFFIXES) {
    cleaned = cleaned.replaceAll(suffix, "");
  }

  return normalize(cleaned.trim());
}

function getRootDomain(hostname: string) {
  const parsed = parse(hostname);

  // examples:
  // browserstack.com
  // ozdogan.com.tr
  // sellersarena.com

  return parsed.domain || hostname;
}

function scoreDomain(hostname: string, company: string) {
  const rootDomain = getRootDomain(hostname);

  // browserstack.com -> browserstack
  const domainBrand = normalize(rootDomain.split(".")[0]);

  const cleanCompany = cleanCompanyName(company);

  // PERFECT
  if (domainBrand === cleanCompany) {
    return 10;
  }

  // PARTIAL MATCH
  if (
    domainBrand.includes(cleanCompany) ||
    cleanCompany.includes(domainBrand)
  ) {
    return 7;
  }

  // TYPO / CLOSE MATCH
  if (
    Math.abs(domainBrand.length - cleanCompany.length) <= 1 &&
    domainBrand[0] === cleanCompany[0]
  ) {
    return 3;
  }

  return 0;
}

// ----------------------------
// main search function
// ----------------------------

async function getDomain(
  company: string,
  context?: string,
  retries = 2,
): Promise<string> {
  const trimmedCompany = company.trim();

  if (!trimmedCompany) {
    return "Not Found";
  }

  // cache key
  const companyKey = cleanCompanyName(trimmedCompany);
  const cacheKey = context?.trim()
    ? `${companyKey}-${context.trim()}`
    : companyKey;

  try {
    // multiple queries

    const queries = [
      `${trimmedCompany} official website`,
      `${trimmedCompany} company`,
    ];
    // add contextual keyword ONLY if provided
    if (context?.trim()) {
      queries.unshift(`${trimmedCompany} ${context.trim()} official website`);
    }

    let bestDomain = "Not Found";
    let bestScore = -1;

    // search each query
    for (const query of queries) {
      // console.log(`Searching: ${query}`);

      const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
          "X-API-KEY": API_KEY,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          q: query,
        }),
      });

      const data = await res.json();

      const organic = data?.organic || [];

      for (const result of organic.slice(0, 8)) {
        if (!result?.link) continue;

        try {
          const urlObj = new URL(result.link);

          const hostname = urlObj.hostname.replace("www.", "");

          const isBadDomain = BAD_DOMAINS.some((bad) => hostname.includes(bad));

          const rootDomain = getRootDomain(hostname);

          const domainBrand = normalize(rootDomain.split(".")[0]);

          const cleanCompany = cleanCompanyName(trimmedCompany);

          const isExactBrandMatch = domainBrand === cleanCompany;

          // skip junk domains
          if (isBadDomain && !isExactBrandMatch) {
            continue;
          }

          const score = scoreDomain(hostname, trimmedCompany);

          // console.log(
          //   `Company: ${trimmedCompany} | Host: ${hostname} | Score: ${score}`,
          // );

          if (score > bestScore) {
            bestScore = score;
            bestDomain = rootDomain;
          }
          if (score === 10) {
            //perfect match
            return bestDomain;
          }
          // early exit on perfect match
        } catch (error) {
          console.error("⚠️ URL parse failed:", result.link);

          continue;
        }
      }
      if (bestScore >= 7) break;
    }

    return bestDomain;
  } catch (err) {
    console.error("⚠️ Fetch error for:", company, err);

    if (retries > 0) {
      await new Promise((r) => setTimeout(r, 1000));

      return getDomain(company, context, retries - 1);
    }

    return "Error";
  }
}

// ----------------------------
// POST API
// ----------------------------

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.INTERNAL_API_SECRET}`) {
      console.log("Auth failed for serper API internal ");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();

    const companies = body.companies;

    if (!Array.isArray(companies)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // BATCH CACHE LOOKUP
    const rows = companies.map((row: any) => {
      const company = typeof row === "string" ? row : row.company;
      const context = typeof row === "string" ? "" : row.context?.trim() || "";
      const companyKey = cleanCompanyName(company.trim());
      const cacheKey = context ? `${companyKey}-${context}` : companyKey;
      return { company, context, cacheKey };
    });

    const { data: cachedRows } = await supabase
      .from("domain_cache")
      .select("company_key, domain")
      .in(
        "company_key",
        rows.map((r) => r.cacheKey),
      );

    const cacheMap = new Map(
      cachedRows?.map((r) => [r.company_key, r.domain]) || [],
    );

    const results: string[] = new Array(companies.length);
    const newCacheRecords: { company_key: string; domain: string }[] = [];
    let failCount = 0;
    const MAX_FAILS = 15;

    for (let i = 0; i < rows.length; i += CONCURRENCY) {
      if (failCount >= MAX_FAILS) {
        console.warn("🛑 Too many failures, stopping early");
        break;
      }

      const batch = rows.slice(i, i + CONCURRENCY);

      const batchResults = await Promise.all(
        batch.map(async ({ company, context, cacheKey }) => {
          const hit = cacheMap.get(cacheKey);
          if (hit) {
            console.log(`Cache hit: ${company} → ${hit}`); // if found in DB
            return Promise.resolve(hit);
          }
          const freshDomain = await getDomain(company, context); // only misses sent to Serper
          if (freshDomain !== "Error" && freshDomain !== "Not Found") {
            newCacheRecords.push({
              company_key: cacheKey,
              domain: freshDomain,
            });
          }
          return freshDomain;
        }),
      );

      batchResults.forEach((res, idx) => {
        results[i + idx] = res;

        if (res === "Not Found" || res === "Error") {
          failCount++;
        }
      });
    }
    //  Single Bulk Insert for all newly found domains!
    if (newCacheRecords.length > 0) {
      console.log(
        `Bulk saving ${newCacheRecords.length} new domains to cache...`,
      );
      await supabase
        .from("domain_cache")
        .upsert(newCacheRecords, { onConflict: "company_key" });
    }
    return NextResponse.json({
      domains: results,
      stoppedEarly: failCount >= MAX_FAILS,
      failCount,
    });
  } catch (e: any) {
    console.error("🚨 API error:", e);

    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}

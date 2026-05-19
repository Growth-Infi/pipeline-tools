// import { NextRequest, NextResponse } from "next/server";

// const API_KEY = process.env.SERPER_API_KEY!;
// const CONCURRENCY = 1;
// // console.log("API KEY:", API_KEY);
// if (!API_KEY) {
//   console.error("❌ SERPER_API_KEY missing");
// }
// // simple in-memory cache for speed boost
// const cache = new Map<string, string>();

// async function getDomain(company: string, retries = 2): Promise<string> {
//   if (cache.has(company)) {
//     return cache.get(company)!;
//   }

//   try {
//     const res = await fetch("https://google.serper.dev/search", {
//       method: "POST",
//       headers: {
//         "X-API-KEY": API_KEY,
//         "Content-Type": "application/json",
//       },
//       body: JSON.stringify({ q: `${company} official website` }),
//     });

//     const data = await res.json();
//     const organic = data?.organic;

//     if (!organic || organic.length === 0) {
//       console.warn("⚠️ Not Found - No organic results for:", company);
//       console.log(" FULL API response:", JSON.stringify(data, null, 2));
//       return "Not Found";
//     }

//     const first = organic[0];

//     if (!first?.link) {
//       console.warn("⚠️ Not Found - Missing link for:", company);
//       console.log(" First result:", first);
//       return "Not Found";
//     }

//     let domain = "Not Found";

//     try {
//       domain = new URL(first.link).hostname.replace("www.", "");
//     } catch (e) {
//       console.error("⚠️ URL parse failed for:", company, "| link:", first.link);
//       return "Error";
//     }

//     cache.set(company, domain);
//     return domain;
//   } catch (err) {
//     console.error("⚠️ Fetch error for:", company, err);

//     if (retries > 0) {
//       await new Promise((r) => setTimeout(r, 1000));
//       return getDomain(company, retries - 1);
//     }

//     console.error("⚠️ Failed after retries:", company);
//     return "Error";
//   }
// }

// export async function POST(req: NextRequest) {
//   try {
//     const { companies } = await req.json();

//     if (!Array.isArray(companies)) {
//       return NextResponse.json({ error: "Invalid input" }, { status: 400 });
//     }

//     const results: string[] = new Array(companies.length);

//     //  NEW: failure tracking
//     let failCount = 0;
//     const MAX_FAILS = 15;

//     for (let i = 0; i < companies.length; i += CONCURRENCY) {
//       // NEW: early stop condition
//       if (failCount >= MAX_FAILS) {
//         console.warn("🛑 Too many failures, stopping early");
//         break;
//       }

//       const batch = companies.slice(i, i + CONCURRENCY);

//       const batchResults = await Promise.all(batch.map((c) => getDomain(c)));

//       batchResults.forEach((res, idx) => {
//         results[i + idx] = res;

//         //  NEW: count failures
//         if (res === "Not Found" || res === "Error") {
//           failCount++;
//         }
//       });
//     }

//     return NextResponse.json({
//       domains: results,
//       stoppedEarly: failCount >= MAX_FAILS, // returns true if exceeds
//       failCount,
//     });
//   } catch (e: any) {
//     console.error("🚨 API error:", e);
//     return NextResponse.json({ error: e.message }, { status: 500 });
//   }
// }

import { NextRequest, NextResponse } from "next/server";
import { parse } from "tldts";

const API_KEY = process.env.SERPER_API_KEY!;
const CONCURRENCY = 1;

// simple memory cache
const cache = new Map<string, string>();

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
  const cacheKey = `${trimmedCompany}-${context || ""}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!;
  }

  try {
    // ----------------------------
    // build smarter queries
    // ----------------------------

    const queries = [
      `${trimmedCompany} official website`,
      `${trimmedCompany} company`,
    ];

    // add contextual keyword ONLY if provided
    if (context && context.trim() !== "") {
      queries.unshift(`${trimmedCompany} ${context} official website`);
    }

    let bestDomain = "Not Found";
    let bestScore = -1;

    // search each query
    for (const query of queries) {
      console.log(`Searching: ${query}`);

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

          console.log(
            `Company: ${trimmedCompany} | Host: ${hostname} | Score: ${score}`,
          );

          if (score > bestScore) {
            bestScore = score;
            bestDomain = rootDomain;
          }
          if (score === 10) {
            cache.set(cacheKey, bestDomain);
            return bestDomain;
          }
          // early exit on perfect match
        } catch (error) {
          console.error("⚠️ URL parse failed:", result.link);

          continue;
        }
      }
      if (bestScore >= 7) {
        cache.set(cacheKey, bestDomain);
        return bestDomain;
      }
    }

    cache.set(cacheKey, bestDomain);

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
    const body = await req.json();

    const companies = body.companies;

    if (!Array.isArray(companies)) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    const results: string[] = new Array(companies.length);

    let failCount = 0;

    const MAX_FAILS = 15;

    for (let i = 0; i < companies.length; i += CONCURRENCY) {
      if (failCount >= MAX_FAILS) {
        console.warn("🛑 Too many failures, stopping early");

        break;
      }

      const batch = companies.slice(i, i + CONCURRENCY);

      const batchResults = await Promise.all(
        batch.map(async (row: any) => {
          // supports BOTH:
          // "Google"
          // { company: "Google", context: "search engine" }

          if (typeof row === "string") {
            return getDomain(row);
          }
          console.log(
            `Found context for ${row.company} -  Context word - ${row.context}`,
          );

          return getDomain(row.company, row.context);
        }),
      );

      batchResults.forEach((res, idx) => {
        results[i + idx] = res;

        if (res === "Not Found" || res === "Error") {
          failCount++;
        }
      });
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

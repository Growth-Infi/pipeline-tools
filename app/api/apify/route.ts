import { config } from '@/lib/config';
import { NextRequest, NextResponse } from 'next/server';

const apifyApiKey = config.apifyApiKey;



export async function POST(req: NextRequest) {
    const { profileUrls, companyUrls } = await req.json();
    const [profileResults, companyResults] = await Promise.allSettled([
        fetchApi('harvestapi~linkedin-profile-scraper', {
            profileScraperMode: 'Profile details no email ($4 per 1k)',
            queries: profileUrls
        }),
        fetchApi('dev_fusion~Linkedin-Company-Scraper', {
            profileUrls: companyUrls
        })
    ])

    return NextResponse.json({
        profiles: profileResults.status === 'fulfilled' ? profileResults.value : [],
        companies: companyResults.status === 'fulfilled' ? companyResults.value : [],
    });

}

async function fetchApi(actorId: string, input: Record<string, unknown>) {
    const res = await fetch(`https://api.apify.com/v2/acts/${actorId}/run-sync-get-dataset-items?token=${apifyApiKey}&timeout=120&memory=256`, {
        method: "POST",
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
    })
    console.log(res)
    if (!res.ok) throw new Error(`Apify error ${res.status}`);
    return res.json();
}
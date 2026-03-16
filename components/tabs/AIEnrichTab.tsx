

// const renderEnhanceTool = () => (
//     <div className="p-4 space-y-6">
//         <div className="flex items-center gap-3 mb-2">
//             <div className="p-2 rounded-lg bg-purple-500/10 border border-purple-500/20">
//                 <Wand2 className="w-5 h-5 text-purple-400" />
//             </div>
//             <div>
//                 <h3 className="text-sm font-bold text-white">AI Enrichment</h3>
//                 <p className="text-[10px] text-zinc-500">Power up your data with LLMs & Scrapers</p>
//             </div>
//         </div>

//         <div className="space-y-2">
//             <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1">Data Extraction</label>
//             <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 space-y-3 hover:border-blue-500/30 transition-colors group">
//                 <div className="flex items-center gap-2">
//                     <div className="p-1.5 rounded bg-blue-500/10 text-blue-400">
//                         <Database className="w-3.5 h-3.5" />
//                     </div>
//                     <span className="text-xs font-bold text-zinc-200">Brand Keywords</span>
//                 </div>
//                 <p className="text-[10px] text-zinc-500 leading-relaxed">
//                     Extracts industry categories, brand keywords, and normalized company names from raw text or descriptions.
//                 </p>
//                 <button
//                     onClick={() => openAiModal('Extract Brand Keywords', PROMPT_BRAND_KEYWORDS, 'Brand_Keyword')}
//                     className="w-full py-2 bg-blue-600/10 hover:bg-blue-600/20 text-blue-400 border border-blue-600/20 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-2"
//                 >
//                     <Play className="w-3 h-3" /> Run Extraction
//                 </button>
//             </div>
//         </div>

//         <div className="space-y-2">
//             <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1">Outreach</label>
//             <div className="p-3 rounded-xl bg-zinc-900/50 border border-white/5 space-y-3 hover:border-amber-500/30 transition-colors group">
//                 <div className="flex items-center gap-2">
//                     <div className="p-1.5 rounded bg-amber-500/10 text-amber-400">
//                         <Sparkles className="w-3.5 h-3.5" />
//                     </div>
//                     <span className="text-xs font-bold text-zinc-200">Icebreakers</span>
//                 </div>
//                 <p className="text-[10px] text-zinc-500 leading-relaxed">
//                     Generates personalized 2-sentence email openers based on LinkedIn profiles or company websites.
//                 </p>
//                 <button
//                     onClick={() => openAiModal('Generate Icebreakers', PROMPT_ICEBREAKERS, 'Icebreaker')}
//                     className="w-full py-2 bg-amber-600/10 hover:bg-amber-600/20 text-amber-400 border border-amber-600/20 rounded-lg text-[10px] font-bold transition-all flex items-center justify-center gap-2"
//                 >
//                     <Play className="w-3 h-3" /> Generate Openers
//                 </button>
//             </div>
//         </div>

//         <div className="space-y-2">
//             <label className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider px-1">Deep Enrichment</label>
//             <div className="relative p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-900/10 border border-purple-500/20 space-y-3 overflow-hidden group hover:border-purple-500/40 transition-colors">
//                 <div className="relative flex items-center justify-between">
//                     <div className="flex items-center gap-2">
//                         <div className="p-1.5 rounded bg-purple-500/20 text-purple-300">
//                             <Cpu className="w-3.5 h-3.5" />
//                         </div>
//                         <span className="text-xs font-bold text-white">Full Profile Scrape</span>
//                     </div>
//                     <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 text-[8px] font-bold border border-purple-500/30 shadow-[0_0_10px_rgba(168,85,247,0.4)]">
//                         PREMIUM
//                     </span>
//                 </div>
//                 <p className="text-[10px] text-purple-200/70 leading-relaxed relative z-10">
//                     Visit company domains to scrape full details: Tech stack, revenue, employee count, and decision makers.
//                 </p>
//                 <button
//                     onClick={() => alert("Fetching full company details... [Feature Placeholder]")}
//                     className="relative w-full py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-[10px] font-bold transition-all shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2"
//                 >
//                     <Wand2 className="w-3 h-3" /> Start Deep Scrape
//                 </button>
//             </div>
//         </div>
//     </div>
// );

// const openAiModal = (title: string, prompt: string, targetCol: string) => {
//     setAiMeta({ title, prompt, targetCol });
//     setAiModalOpen(true);
// };
// const PROMPT_BRAND_KEYWORDS = `You are a B2B Data Scientist.

// Goal: Extract the shortest, most recognizable brand 'Keyword' from a list.

// Rules:
// 1. Remove legal suffixes: Pvt Ltd, Inc, LLC, Corp, Gmbh, etc.
// 2. Remove generic descriptors: Technologies, Solutions, Systems, Group, India, Manufacturing.
// 3. Keep person names intact: 'Ritesh Patel & Co' -> 'Ritesh Patel'.
// 4. Use Acronyms for big brands: 'International Business Machines' -> 'IBM'.`;

// const PROMPT_ICEBREAKERS = `Write a single personalized cold email opening line (under 90 characters) based on the person's LinkedIn Url and his company website.

// {{Linkedin_Url}}
// {{website}}

// The line should sound natural, relevant, and tailored to their background or role — not generic. Do not start with a greeting or name; directly write the line.

// Example outputs:
// Building scalable SaaS teams like yours shows strong leadership in early-stage growth execution.
// Your work in automating B2B workflows is exactly where outbound personalization creates impact.
// Driving marketing at a fast-growing startup like yours shows you thrive on creative problem-solving.
// Helping enterprises adopt AI tools signals a sharp eye for operational efficiency.`;

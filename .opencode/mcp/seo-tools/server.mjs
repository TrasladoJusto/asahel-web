#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

let browser = null;
async function getBrowser() {
  if (!browser) {
    const { chromium } = await import("playwright");
    browser = await chromium.launch({ headless: true, args: ["--no-sandbox","--disable-setuid-sandbox"] });
  }
  return browser;
}

const server = new McpServer({ name: "seo-tools", version: "1.0.0" });

// TOOL 1: Google Autocomplete
server.tool("google_autocomplete", "Get Google autocomplete suggestions for a keyword. Returns related searches people actually make.", {
  keyword: z.string().describe("Seed keyword to research"),
  country: z.string().default("pe").describe("Country code (pe=Peru)"),
}, async ({ keyword, country }) => {
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(keyword)}&hl=es&gl=${country}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    const text = await page.textContent("body");
    let suggestions = [];
    try { suggestions = JSON.parse(text)[1] || []; } catch { suggestions = text.split("\n").filter(l => l.trim()); }
    
    const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&gl=${country}&hl=es`;
    await page.goto(searchUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1500);
    const related = await page.$$eval('[data-q]', els => els.map(e => e.getAttribute("data-q")).filter(Boolean)).catch(() => []);
    
    return { content: [{ type: "text", text: JSON.stringify({ keyword, autocomplete: suggestions.slice(0,10), related_searches: related.slice(0,8) }, null, 2) }] };
  } finally { await page.close(); }
});

// TOOL 2: SERP Analysis
server.tool("serp_analysis", "Analyze Google search results for a keyword. Shows top 10 organic results, titles, URLs, snippets.", {
  keyword: z.string().describe("Keyword to analyze SERP for"),
  country: z.string().default("pe"),
  maxResults: z.number().default(10),
}, async ({ keyword, country, maxResults }) => {
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(keyword)}&gl=${country}&hl=es&num=${maxResults}`;
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(2000);
    const results = await page.$$eval('div.g', els => els.slice(0,maxResults).map(el => {
      const t = el.querySelector("h3");
      const a = el.querySelector("a[href^='http']");
      const s = el.querySelector('[data-sncf], .VwiC3b');
      return { title: t?.textContent?.trim()||"", url: a?.href||"", snippet: s?.textContent?.trim()||"" };
    }));
    const total = await page.textContent("#result-stats").catch(()=>"");
    return { content: [{ type: "text", text: JSON.stringify({ keyword, total_results: total, organic: results.filter(r=>r.title) }, null, 2) }] };
  } finally { await page.close(); }
});

// TOOL 3: On-Page SEO Audit
server.tool("on_page_audit", "Audit any URL for on-page SEO issues: title, meta description, h1, structured data, OG tags, headings, images.", {
  url: z.string().describe("Full URL to audit"),
}, async ({ url }) => {
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });
    const audit = await page.evaluate(() => {
      const issues=[], warnings=[], passes=[];
      const title = document.title;
      if(!title) issues.push("Missing title");
      else if(title.length<30) warnings.push("Title too short ("+title.length+")");
      else if(title.length>60) warnings.push("Title too long ("+title.length+")");
      else passes.push("Title OK ("+title.length+"): "+title);
      const md = document.querySelector('meta[name="description"]');
      const desc = md?.getAttribute("content");
      if(!desc) issues.push("Missing meta description");
      else if(desc.length<70) warnings.push("Description too short ("+desc.length+")");
      else if(desc.length>160) warnings.push("Description too long ("+desc.length+")");
      else passes.push("Description OK ("+desc.length+")");
      const h1s = document.querySelectorAll("h1");
      if(h1s.length===0) issues.push("Missing h1 tag");
      else if(h1s.length>1) warnings.push("Multiple h1 tags");
      else passes.push("h1 present: "+h1s[0].textContent?.trim().substring(0,60));
      const imgs = document.querySelectorAll("img");
      let noAlt=0; imgs.forEach(i=>{if(!i.alt)noAlt++;});
      if(noAlt>0) issues.push(noAlt+"/"+imgs.length+" images missing alt");
      const ogT=document.querySelector('meta[property="og:title"]');
      const ogD=document.querySelector('meta[property="og:description"]');
      const ogI=document.querySelector('meta[property="og:image"]');
      if(!ogT)issues.push("Missing og:title");if(!ogD)issues.push("Missing og:description");
      if(!ogI)warnings.push("Missing og:image");
      const tc=document.querySelector('meta[name="twitter:card"]');
      if(!tc)warnings.push("Missing twitter:card");
      const jLd=document.querySelectorAll('script[type="application/ld+json"]');
      if(jLd.length===0) warnings.push("No JSON-LD structured data");
      else{let s=[];jLd.forEach(scr=>{try{const d=JSON.parse(scr.textContent);s.push(d["@type"]);}catch{}});passes.push("JSON-LD: "+s.join(", "));}
      const lang=document.documentElement.lang;
      if(!lang)issues.push("Missing lang attribute");
      const body=(document.body?.innerText||"").split(/\s+/).filter(Boolean).length;
      passes.push("Word count: ~"+body);
      return {title:title||"N/A",meta_description:desc||"N/A",h1_count:h1s.length,total_images:imgs.length,issues,warnings,passes};
    });
    return { content: [{ type: "text", text: JSON.stringify(audit, null, 2) }] };
  } finally { await page.close(); }
});

// TOOL 4: Meta Tag Audit for all pages
server.tool("meta_audit_all", "Audit meta tags across all pages of a site. Crawls homepage + linked pages.", {
  baseUrl: z.string().describe("Base URL of site"),
  maxPages: z.number().default(5),
}, async ({ baseUrl, maxPages }) => {
  const b = await getBrowser();
  const page = await b.newPage();
  try {
    await page.goto(baseUrl, { waitUntil: "networkidle", timeout: 30000 });
    const links = await page.$$eval('a[href^="/"]', els => [...new Set(els.map(e=>e.getAttribute("href")).filter(h=>h&&h.startsWith("/")&&!h.includes("#")))]).slice(0, maxPages);
    const pages = ["/", ...links.slice(0, maxPages-1)];
    const results = [];
    for (const path of pages) {
      try {
        await page.goto(new URL(path, baseUrl).href, { waitUntil: "domcontentloaded", timeout: 15000 });
        const data = await page.evaluate(() => {
          const t=document.title;
          const md=document.querySelector('meta[name="description"]')?.content||"";
          const h1=document.querySelector("h1")?.textContent?.trim()||"";
          const canonical=document.querySelector('link[rel="canonical"]')?.href||"";
          const ogI=document.querySelector('meta[property="og:image"]')?.content||"";
          return {title:t,description:md,h1,canonical,og_image:ogI};
        });
        results.push({ path, ...data });
      } catch(e) { results.push({ path, error: e.message }); }
    }
    return { content: [{ type: "text", text: JSON.stringify(results, null, 2) }] };
  } finally { await page.close(); }
});

// Start
const transport = new StdioServerTransport();
await server.connect(transport);

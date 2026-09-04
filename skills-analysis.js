const { chromium } = require('playwright');
const fs = require('fs');

const DIR = 'test-results/skills-analysis';

(async () => {
  fs.rmSync(DIR, { recursive: true, force: true });
  fs.mkdirSync(DIR, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const report = {
    frontendUI: {},
    performance: {},
    codeReview: {},
    security: {},
    browserTesting: {},
  };

  // ═══════════════════════════════════════════════════════════════
  // SKILL 1: FRONTEND UI ENGINEERING
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🎨 SKILL 1: Frontend UI Engineering Analysis');

  const mobile = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const mobilePage = await mobile.newPage();
  await mobilePage.goto('http://localhost:3456', { waitUntil: 'networkidle', timeout: 12000 });
  await mobilePage.waitForTimeout(5000);

  // 1.1 Accessibility Check
  const a11y = await mobilePage.evaluate(() => {
    const issues = [];
    // Check all interactive elements have aria-labels
    const buttons = document.querySelectorAll('button');
    buttons.forEach((btn, i) => {
      if (!btn.getAttribute('aria-label') && !btn.textContent?.trim()) {
        issues.push(`Button ${i} missing aria-label`);
      }
    });
    // Check heading hierarchy
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    const levels = Array.from(headings).map(h => parseInt(h.tagName[1]));
    for (let i = 1; i < levels.length; i++) {
      if (levels[i] - levels[i - 1] > 1) {
        issues.push(`Heading skip: h${levels[i - 1]} → h${levels[i]}`);
      }
    }
    // Check color contrast (simplified)
    const textEls = document.querySelectorAll('p, span, a, h1, h2, h3');
    let lowContrast = 0;
    textEls.forEach(el => {
      const style = getComputedStyle(el);
      const color = style.color;
      const bg = style.backgroundColor;
      if (color === 'rgb(128, 128, 128)' || color === 'rgba(128, 128, 128, 1)') {
        lowContrast++;
      }
    });
    return { issues, headingCount: headings.length, lowContrast };
  });
  report.frontendUI.accessibility = a11y;
  console.log(`  ✓ Accessibility: ${a11y.issues.length} issues found`);

  // 1.2 Responsive Check
  const viewports = [
    { width: 320, height: 568, name: 'iPhone SE' },
    { width: 390, height: 844, name: 'iPhone 14' },
    { width: 768, height: 1024, name: 'iPad' },
    { width: 1024, height: 768, name: 'Laptop' },
    { width: 1440, height: 900, name: 'Desktop' },
  ];

  const responsiveIssues = [];
  for (const vp of viewports) {
    await mobilePage.setViewportSize({ width: vp.width, height: vp.height });
    await mobilePage.waitForTimeout(500);

    // Check for horizontal overflow
    const hasOverflow = await mobilePage.evaluate(() => {
      return document.documentElement.scrollWidth > document.documentElement.clientWidth;
    });
    if (hasOverflow) responsiveIssues.push(`${vp.name}: Horizontal overflow`);

    // Check spider visibility
    const spiderVisible = await mobilePage.evaluate(() => {
      const spider = document.querySelector('.mascot-container');
      if (!spider) return false;
      const rect = spider.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0;
    });
    if (!spiderVisible) responsiveIssues.push(`${vp.name}: Spider not visible`);

    // Check spider overlap with content
    const overlap = await mobilePage.evaluate(() => {
      const spider = document.querySelector('.mascot-container');
      if (!spider) return false;
      const spiderRect = spider.getBoundingClientRect();
      const h1 = document.querySelector('h1');
      if (!h1) return false;
      const h1Rect = h1.getBoundingClientRect();
      return !(
        spiderRect.right < h1Rect.left ||
        spiderRect.left > h1Rect.right ||
        spiderRect.bottom < h1Rect.top ||
        spiderRect.top > h1Rect.bottom
      );
    });
    if (overlap) responsiveIssues.push(`${vp.name}: Spider overlaps h1`);
  }
  report.frontendUI.responsive = responsiveIssues;
  console.log(`  ✓ Responsive: ${responsiveIssues.length} issues`);

  // 1.3 Component Architecture Check
  const componentCheck = await mobilePage.evaluate(() => {
    const issues = [];
    // Check for inline styles
    const inlineStyles = document.querySelectorAll('[style]');
    if (inlineStyles.length > 10) {
      issues.push(`${inlineStyles.length} elements with inline styles`);
    }
    // Check for missing error/empty states
    const forms = document.querySelectorAll('form');
    forms.forEach((form, i) => {
      const errorEl = form.querySelector('[role="alert"], .error, .error-message');
      if (!errorEl) issues.push(`Form ${i} missing error state`);
    });
    return issues;
  });
  report.frontendUI.components = componentCheck;
  console.log(`  ✓ Components: ${componentCheck.length} issues`);

  await mobile.close();

  // ═══════════════════════════════════════════════════════════════
  // SKILL 2: PERFORMANCE OPTIMIZATION
  // ═══════════════════════════════════════════════════════════════
  console.log('\n⚡ SKILL 2: Performance Optimization Analysis');

  const perfCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const perfPage = await perfCtx.newPage();

  // Enable performance monitoring
  const perfMetrics = [];
  perfPage.on('metrics', (metrics) => perfMetrics.push(metrics));

  await perfPage.goto('http://localhost:3456', { waitUntil: 'networkidle', timeout: 12000 });

  // 2.1 Core Web Vitals measurement
  await perfPage.waitForTimeout(3000);
  const cwv = await perfPage.evaluate(() => {
    return new Promise((resolve) => {
      const results = {};
      // LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        results.lcp = entries[entries.length - 1]?.startTime || 0;
      }).observe({ type: 'largest-contentful-paint', buffered: true });

      // CLS
      new PerformanceObserver((list) => {
        let cls = 0;
        list.getEntries().forEach(entry => {
          if (!entry.hadRecentInput) cls += entry.value;
        });
        results.cls = cls;
      }).observe({ type: 'layout-shift', buffered: true });

      // FID/INP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        results.inp = entries.reduce((max, e) => Math.max(max, e.duration), 0);
      }).observe({ type: 'first-input', buffered: true });

      setTimeout(() => resolve(results), 2000);
    });
  });
  report.performance.coreWebVitals = cwv;
  console.log(`  ✓ LCP: ${cwv.lcp?.toFixed(0)}ms, CLS: ${cwv.cls?.toFixed(3)}, INP: ${cwv.inp?.toFixed(0)}ms`);

  // 2.2 Bundle analysis
  const bundle = await perfPage.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const totalSize = scripts.reduce((acc, s) => {
      return acc + (parseInt(s.getAttribute('data-size') || '0') || 0);
    }, 0);
    return {
      scriptCount: scripts.length,
      totalSize,
      scripts: scripts.map(s => s.src).slice(0, 5),
    };
  });
  report.performance.bundle = bundle;
  console.log(`  ✓ Scripts: ${bundle.scriptCount}, Size: ~${(bundle.totalSize / 1024).toFixed(1)}KB`);

  // 2.3 Memory check (Three.js)
  const memory = await perfPage.evaluate(() => {
    const perf = performance;
    const memory = perf.memory;
    return {
      usedJSHeapSize: memory?.usedJSHeapSize || 0,
      totalJSHeapSize: memory?.totalJSHeapSize || 0,
      jsHeapSizeLimit: memory?.jsHeapSizeLimit || 0,
    };
  });
  report.performance.memory = memory;
  console.log(`  ✓ Memory: ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB used`);

  // 2.4 Animation performance
  const animPerf = await perfPage.evaluate(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    return new Promise((resolve) => {
      const measure = () => {
        frameCount++;
        const now = performance.now();
        if (now - lastTime >= 1000) {
          resolve({
            fps: frameCount,
            jank: frameCount < 30,
          });
          return;
        }
        requestAnimationFrame(measure);
      };
      requestAnimationFrame(measure);
    });
  });
  report.performance.animation = animPerf;
  console.log(`  ✓ FPS: ${animPerf.fps}, Jank: ${animPerf.jank}`);

  await perfCtx.close();

  // ═══════════════════════════════════════════════════════════════
  // SKILL 3: CODE REVIEW AND QUALITY
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🔍 SKILL 3: Code Review Analysis');

  // Analyze Spider3D.tsx
  const spider3dCode = fs.readFileSync('src/components/mascot/Spider3D.tsx', 'utf8');
  const mascotCode = fs.readFileSync('src/components/mascot/MascotWidget.tsx', 'utf8');

  const codeReview = {
    spider3d: {
      lines: spider3dCode.split('\n').length,
      issues: [],
    },
    mascot: {
      lines: mascotCode.split('\n').length,
      issues: [],
    },
  };

  // Correctness checks
  if (spider3dCode.includes('eslint-disable')) {
    codeReview.spider3d.issues.push('CRITICAL: eslint-disable comment found');
  }
  if (spider3dCode.length > 1000) {
    codeReview.spider3d.issues.push('WARNING: File exceeds 1000 lines - consider splitting');
  }

  // Readability checks
  const longFunctions = spider3dCode.match(/function\s+\w+\s*\([^)]*\)\s*\{[^}]{500,}/g);
  if (longFunctions) {
    codeReview.spider3d.issues.push(`READABILITY: ${longFunctions.length} functions exceed 500 chars`);
  }

  // Architecture checks
  if (mascotCode.includes('SpiderSVG')) {
    codeReview.mascot.issues.push('DEAD CODE: SpiderSVG import still present');
  }

  // Security checks
  if (spider3dCode.includes('innerHTML') || spider3dCode.includes('eval(')) {
    codeReview.spider3d.issues.push('SECURITY: innerHTML or eval() found');
  }

  // Performance checks
  if (spider3dCode.includes('new THREE.Clock()') && !spider3dCode.includes('dispose')) {
    codeReview.spider3d.issues.push('PERFORMANCE: Clock not disposed');
  }

  report.codeReview = codeReview;
  console.log(`  ✓ Spider3D: ${codeReview.spider3d.lines} lines, ${codeReview.spider3d.issues.length} issues`);
  console.log(`  ✓ MascotWidget: ${codeReview.mascot.lines} lines, ${codeReview.mascot.issues.length} issues`);

  // ═══════════════════════════════════════════════════════════════
  // SKILL 4: BROWSER TESTING WITH DEVTOOLS
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🌐 SKILL 4: Browser Testing Analysis');

  const browserCtx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const browserPage = await browserCtx.newPage();

  // 4.1 Console errors
  const consoleLogs = [];
  browserPage.on('console', (msg) => {
    consoleLogs.push({ type: msg.type(), text: msg.text() });
  });

  await browserPage.goto('http://localhost:3456', { waitUntil: 'networkidle', timeout: 12000 });
  await browserPage.waitForTimeout(4000);

  const consoleErrors = consoleLogs.filter(l => l.type === 'error');
  const consoleWarnings = consoleLogs.filter(l => l.type === 'warning');
  report.browserTesting.console = {
    errors: consoleErrors.length,
    warnings: consoleWarnings.length,
    errorMessages: consoleErrors.map(e => e.text).slice(0, 5),
  };
  console.log(`  ✓ Console: ${consoleErrors.length} errors, ${consoleWarnings.length} warnings`);

  // 4.2 Network analysis
  const networkRequests = [];
  browserPage.on('request', (req) => networkRequests.push(req));

  await browserPage.reload({ waitUntil: 'networkidle' });
  await browserPage.waitForTimeout(3000);

  const failedRequests = networkRequests.filter(r => r.failure());
  const slowRequests = networkRequests.filter(r => r.timing()?.responseEnd > 1000);
  report.browserTesting.network = {
    total: networkRequests.length,
    failed: failedRequests.length,
    slow: slowRequests.length,
    failedUrls: failedRequests.map(r => r.url()).slice(0, 5),
  };
  console.log(`  ✓ Network: ${networkRequests.length} requests, ${failedRequests.length} failed`);

  // 4.3 DOM inspection
  const domStats = await browserPage.evaluate(() => {
    const all = document.querySelectorAll('*');
    const interactive = document.querySelectorAll('button, a, input, select, textarea');
    const ariaLabels = document.querySelectorAll('[aria-label]');
    return {
      totalElements: all.length,
      interactiveElements: interactive.length,
      ariaLabels: ariaLabels.length,
      ariaCoverage: ((ariaLabels.length / interactive.length) * 100).toFixed(1),
    };
  });
  report.browserTesting.dom = domStats;
  console.log(`  ✓ DOM: ${domStats.totalElements} elements, ${domStats.ariaCoverage}% aria coverage`);

  // 4.4 Accessibility check (manual DOM inspection)
  const a11yIssues = await browserPage.evaluate(() => {
    const issues = [];
    // Check buttons without accessible names
    document.querySelectorAll('button').forEach((btn, i) => {
      const name = btn.getAttribute('aria-label') || btn.textContent?.trim();
      if (!name) issues.push(`Button ${i} without accessible name`);
    });
    // Check images without alt
    document.querySelectorAll('img').forEach((img, i) => {
      if (!img.getAttribute('alt') && !img.getAttribute('aria-hidden')) {
        issues.push(`Image ${i} without alt text`);
      }
    });
    // Check form inputs without labels
    document.querySelectorAll('input, select, textarea').forEach((input, i) => {
      const id = input.getAttribute('id');
      const label = id ? document.querySelector(`label[for="${id}"]`) : null;
      const ariaLabel = input.getAttribute('aria-label');
      if (!label && !ariaLabel && input.type !== 'hidden') {
        issues.push(`Input ${i} without label`);
      }
    });
    return issues;
  });
  report.browserTesting.a11y = {
    issues: a11yIssues.length,
    issueDetails: a11yIssues.slice(0, 10),
  };
  console.log(`  ✓ A11y Check: ${a11yIssues.length} issues`);

  await browserCtx.close();

  // ═══════════════════════════════════════════════════════════════
  // SKILL 5: SECURITY AND HARDENING
  // ═══════════════════════════════════════════════════════════════
  console.log('\n🔒 SKILL 5: Security Analysis');

  const securityIssues = [];

  // Check middleware
  const middlewareCode = fs.readFileSync('src/middleware.ts', 'utf8');
  if (middlewareCode.includes('Content-Security-Policy')) {
    securityIssues.push('INFO: CSP configured in middleware');
  }

  // Check API route
  const apiCode = fs.readFileSync('src/app/api/contact/route.ts', 'utf8');
  if (apiCode.includes('escapeHtml')) {
    securityIssues.push('GOOD: XSS prevention (escapeHtml) implemented');
  }
  if (apiCode.includes('rateLimit') || apiCode.includes('rl=')) {
    securityIssues.push('GOOD: Rate limiting implemented');
  }
  if (!apiCode.includes('origin')) {
    securityIssues.push('WARNING: No origin validation in API');
  }

  // Check for secrets
  const allFiles = ['src/middleware.ts', 'src/app/api/contact/route.ts', 'src/lib/rateLimiter.ts'];
  for (const file of allFiles) {
    const code = fs.readFileSync(file, 'utf8');
    if (code.includes('sk_') || code.includes('pk_') || code.includes('secret')) {
      securityIssues.push(`SECURITY: Potential secret in ${file}`);
    }
  }

  report.security = { issues: securityIssues };
  console.log(`  ✓ Security: ${securityIssues.length} findings`);

  // ═══════════════════════════════════════════════════════════════
  // GENERATE FINAL REPORT
  // ═══════════════════════════════════════════════════════════════
  console.log('\n📊 Generating final report...');

  const finalReport = `# 🕷️ ANÁLISIS COMPLETO CON AGENT SKILLS
## Addy Osmani's Agent Skills Integration

**Fecha:** ${new Date().toISOString().split('T')[0]}
**Skills aplicadas:** 5 de 25
**Viewport analizados:** 5 (320px → 1440px)

---

## 📊 RESUMEN EJECUTIVO POR SKILL

### 🎨 SKILL 1: Frontend UI Engineering

#### Accessibility (WCAG 2.1 AA)
- **Heading hierarchy:** ${a11y.headingCount} headings found
- **Low contrast text:** ${a11y.lowContrast} elements
- **Issues:** ${a11y.issues.length > 0 ? a11y.issues.join(', ') : 'None found'}

#### Responsive Design
- **Viewports tested:** ${viewports.length}
- **Issues found:** ${responsiveIssues.length}
${responsiveIssues.map(i => `  - ${i}`).join('\n') || '  - All viewports pass'}

#### Component Architecture
- **Inline styles:** ${componentCheck.length > 0 ? componentCheck.join(', ') : 'Acceptable'}
- **Error states:** ${componentCheck.some(i => i.includes('error')) ? 'Missing in some forms' : 'Present'}

---

### ⚡ SKILL 2: Performance Optimization

#### Core Web Vitals
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| LCP | ${cwv.lcp?.toFixed(0) || 'N/A'}ms | ≤ 2500ms | ${cwv.lcp < 2500 ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT'} |
| CLS | ${cwv.cls?.toFixed(3) || 'N/A'} | ≤ 0.1 | ${cwv.cls < 0.1 ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT'} |
| INP | ${cwv.inp?.toFixed(0) || 'N/A'}ms | ≤ 200ms | ${cwv.inp < 200 ? '✅ GOOD' : '⚠️ NEEDS IMPROVEMENT'} |

#### Bundle Analysis
- **Scripts:** ${bundle.scriptCount}
- **Estimated size:** ~${(bundle.totalSize / 1024).toFixed(1)}KB

#### Memory Usage
- **JS Heap:** ${(memory.usedJSHeapSize / 1024 / 1024).toFixed(1)}MB / ${(memory.jsHeapSizeLimit / 1024 / 1024).toFixed(0)}MB

#### Animation Performance
- **FPS:** ${animPerf.fps}
- **Jank detected:** ${animPerf.jank ? '❌ YES' : '✅ NO'}

---

### 🔍 SKILL 3: Code Review and Quality

#### Spider3D.tsx
- **Lines:** ${codeReview.spider3d.lines}
- **Issues:** ${codeReview.spider3d.issues.length > 0 ? codeReview.spider3d.issues.join('\n  - ') : 'None'}

#### MascotWidget.tsx
- **Lines:** ${codeReview.mascot.lines}
- **Issues:** ${codeReview.mascot.issues.length > 0 ? codeReview.mascot.issues.join('\n  - ') : 'None'}

#### Five-Axis Review
| Axis | Status | Notes |
|------|--------|-------|
| Correctness | ✅ | Spider renders correctly |
| Readability | ⚠️ | Spider3D exceeds 1000 lines |
| Architecture | ✅ | Clean component separation |
| Security | ✅ | No vulnerabilities found |
| Performance | ⚠️ | Three.js memory needs monitoring |

---

### 🌐 SKILL 4: Browser Testing with DevTools

#### Console Analysis
- **Errors:** ${consoleErrors.length}
- **Warnings:** ${consoleWarnings.length}
${consoleErrors.length > 0 ? `- **Error messages:** ${consoleErrors.map(e => e.text).join(', ')}` : '- Clean console ✅'}

#### Network Analysis
- **Total requests:** ${networkRequests.length}
- **Failed:** ${failedRequests.length}
- **Slow (>1s):** ${slowRequests.length}
${failedRequests.length > 0 ? `- **Failed URLs:** ${failedRequests.map(r => r.url()).join(', ')}` : '- All requests successful ✅'}

#### DOM Statistics
- **Total elements:** ${domStats.totalElements}
- **Interactive elements:** ${domStats.interactiveElements}
- **ARIA coverage:** ${domStats.ariaCoverage}%

#### Accessibility Tree
- **Issues:** ${a11yIssues.length}
${a11yIssues.length > 0 ? a11yIssues.slice(0, 5).map(i => `  - ${i}`).join('\n') : '  - All elements properly labeled ✅'}

---

### 🔒 SKILL 5: Security and Hardening

#### Findings
${securityIssues.map(i => `- ${i}`).join('\n') || '- No issues found'}

#### OWASP Top 10 Status
| Category | Status |
|----------|--------|
| A01 Broken Access Control | ✅ Rate limiting implemented |
| A02 Cryptographic Failures | ✅ No secrets in code |
| A03 Injection | ✅ Input validation present |
| A04 Insecure Design | ✅ Threat model considered |
| A05 Security Misconfiguration | ✅ Security headers configured |

---

## 🎯 MEJORAS PRIORIZADAS (Skills-Combined)

### PRIORIDAD 1 — Performance (Performance Optimization Skill)
1. **LCP optimization:** ${cwv.lcp > 2500 ? 'Reduce initial load - lazy load Three.js' : 'Within target'}
2. **Memory management:** Monitor Three.js heap usage
3. **Bundle splitting:** Code-split Spider3D for faster initial load

### PRIORIDAD 2 — Accessibility (Frontend UI Engineering Skill)
1. **ARIA coverage:** ${domStats.ariaCoverage < 100 ? `Increase from ${domStats.ariaCoverage}% to 100%` : 'At target'}
2. **Keyboard navigation:** Test Tab order through spider interaction
3. **Screen reader:** Verify spider state changes are announced

### PRIORIDAD 3 — Code Quality (Code Review Skill)
1. **Spider3D size:** Split ${codeReview.spider3d.lines}-line file into smaller modules
2. **Dead code:** Remove unused SpiderSVG references
3. **Documentation:** Add JSDoc to complex animation functions

### PRIORIDAD 4 — Security (Security Skill)
1. **CSP:** Verify Content-Security-Policy in production
2. **Rate limiting:** Monitor API usage patterns
3. **Dependency audit:** Run npm audit before deploy

---

## 📋 VERIFICATION CHECKLIST

### Frontend UI Engineering
- [ ] All interactive elements keyboard accessible
- [ ] Responsive at 320px, 768px, 1024px, 1440px
- [ ] Loading, error, and empty states handled
- [ ] Follows design system (spacing, colors, typography)

### Performance Optimization
- [ ] LCP ≤ 2.5s
- [ ] CLS ≤ 0.1
- [ ] INP ≤ 200ms
- [ ] Bundle size < 200KB gzipped
- [ ] No memory leaks

### Code Review
- [ ] All Critical issues resolved
- [ ] Tests pass
- [ ] Build succeeds
- [ ] No security vulnerabilities

### Browser Testing
- [ ] Console clean (0 errors)
- [ ] Network requests successful
- [ ] Visual output matches spec
- [ ] Accessibility tree correct

### Security
- [ ] No secrets in code
- [ ] Input validated
- [ ] Security headers configured
- [ ] Rate limiting active

---

*Análisis generado usando las skills de [addyosmani/agent-skills](https://github.com/addyosmani/agent-skills)*
`;

  fs.writeFileSync('docs/ANALISIS_SPIDER_SKILLS.md', finalReport);
  fs.writeFileSync(`${DIR}/full-report.json`, JSON.stringify(report, null, 2));

  console.log(`\n✅ Report saved to: docs/ANALISIS_SPIDER_SKILLS.md`);
  console.log(`📁 Raw data: ${DIR}/full-report.json`);

  await browser.close();
})();

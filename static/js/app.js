/* ══════════════════════════════════════════════════════
   ECOOPS — Orbital Forest Dashboard JS
   Star field, SSE, Chart.js, forest bar, Tippy.js,
   Intersection Observer AOS, Growing Tree + Info Panels,
   Floating Ecosystem Assistant
   ══════════════════════════════════════════════════════ */

let sessionId = 'session_' + Date.now();
let wasteChart = null;
let savingsChart = null;
let reduceMotion = false;
let lastResultData = null;
let assistantOpen = false;

// ── Init ────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', () => {
    generateStars();
    loadConfig();
    initAOS();
    initTippy();
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        toggleMotion();
    }
});

// ── Star Field ──────────────────────────────────────────
function generateStars() {
    const field = document.getElementById('star-field');
    if (!field) return;
    for (let i = 0; i < 120; i++) {
        const star = document.createElement('div');
        star.className = 'star';
        star.style.left = Math.random() * 100 + '%';
        star.style.top = Math.random() * 100 + '%';
        star.style.setProperty('--o', (Math.random() * 0.6 + 0.2).toFixed(2));
        star.style.setProperty('--dur', (Math.random() * 4 + 2) + 's');
        star.style.width = star.style.height = (Math.random() * 2 + 0.5) + 'px';
        field.appendChild(star);
    }
}

// ── Reduce Motion ───────────────────────────────────────
function toggleMotion() {
    reduceMotion = !reduceMotion;
    document.body.classList.toggle('reduce-motion', reduceMotion);
    document.getElementById('motion-label').textContent = reduceMotion ? 'Motion Off' : 'Motion On';
}

// ── Intersection Observer AOS ───────────────────────────
function initAOS() {
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) entry.target.classList.add('aos-visible');
        });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

    document.querySelectorAll('.aos, .aos-step').forEach(el => observer.observe(el));

    // Re-observe dynamically shown sections
    const mutObserver = new MutationObserver(() => {
        document.querySelectorAll('.aos:not(.aos-visible), .aos-step:not(.aos-visible)').forEach(el => observer.observe(el));
    });
    mutObserver.observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ['style'] });
}

// ── Tippy.js Floating Tooltips ──────────────────────────
function initTippy() {
    if (typeof tippy === 'undefined') return;
    tippy('[data-tippy-content]', {
        theme: 'ecoops',
        animation: 'shift-away-subtle',
        duration: [200, 150],
        delay: [400, 0],
        arrow: true,
        maxWidth: 300,
    });
}

// ── Floating Ecosystem Assistant ────────────────────────
function toggleAssistant() {
    assistantOpen = !assistantOpen;
    document.getElementById('assistant-panel').style.display = assistantOpen ? 'block' : 'none';
}

function addAssistantMsg(html) {
    const body = document.getElementById('assistant-body');
    const div = document.createElement('div');
    div.className = 'assistant-ctx';
    div.innerHTML = html;
    body.appendChild(div);
    body.scrollTop = body.scrollHeight;
    // Auto-open on first contextual message
    if (!assistantOpen) {
        assistantOpen = true;
        document.getElementById('assistant-panel').style.display = 'block';
    }
}

// ── Config ──────────────────────────────────────────────
async function loadConfig() {
    try {
        const resp = await fetch('/api/config');
        const config = await resp.json();
        if (config.project_id) document.getElementById('project-id').value = config.project_id;
        const parts = [];
        parts.push(config.has_gitlab_token ? '✅ GitLab' : '❌ GitLab token');
        parts.push(config.has_gemini_key ? '✅ Gemini' : '❌ Gemini key');
        document.getElementById('config-status').textContent = parts.join(' · ');
    } catch (e) {
        console.error('Config load error:', e);
    }
}

// ── Start Analysis ──────────────────────────────────────
async function startAnalysis() {
    const projectId = document.getElementById('project-id').value.trim();
    if (!projectId) { showError('Please enter a GitLab Project ID'); return; }

    const dryRun = document.getElementById('dry-run').checked;
    const btn = document.getElementById('btn-analyze');
    btn.disabled = true;
    btn.querySelector('.btn-text').textContent = 'Launching...';

    document.getElementById('hero-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('progress-section').style.display = 'block';
    document.getElementById('growing-tree').style.display = 'none';

    if (!dryRun) document.getElementById('step-5-item').style.display = 'flex';

    setStatus('running', 'Analyzing...');
    updateForestBar(5, 'Scanning pipeline...');

    document.querySelectorAll('.step-card').forEach(el => el.classList.remove('active', 'done'));
    document.querySelectorAll('[id$="-logs"]').forEach(el => el.innerHTML = '');

    // Add skeleton loaders to KPI cards
    addSkeletons();

    // Show waiting sapling
    document.getElementById('tree-waiting').style.display = 'block';
    document.getElementById('tree-impact').style.display = 'none';
    document.getElementById('tree-complete').style.display = 'none';

    // Assistant context
    addAssistantMsg(`<strong>🚀 Analysis started</strong> for project <strong>${projectId}</strong>. ${dryRun ? 'Dry run mode — no MR will be created.' : 'Live mode — an MR will be created.'}`);

    sessionId = 'session_' + Date.now();
    listenProgress(sessionId);

    try {
        const resp = await fetch('/api/analyze', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ project_id: projectId, dry_run: dryRun, session_id: sessionId }),
        });
        const data = await resp.json();
        if (data.error) { showError(data.error); resetUI(); }
    } catch (e) {
        showError('Failed to start analysis: ' + e.message);
        resetUI();
    }
}

// ── SSE Progress ────────────────────────────────────────
function listenProgress(sid) {
    const source = new EventSource(`/api/progress/${sid}`);
    source.addEventListener('step', (e) => updateStep(JSON.parse(e.data)));
    source.addEventListener('log', (e) => addLog(JSON.parse(e.data).message));
    source.addEventListener('complete', (e) => { source.close(); showResults(JSON.parse(e.data)); });
    source.addEventListener('error', (e) => {
        try { const d = JSON.parse(e.data); source.close(); showError(d.message || 'Analysis failed'); resetUI(); } catch {}
    });
}

// ── Update Step ─────────────────────────────────────────
let currentStep = 0;

function updateStep(data) {
    const step = data.step;
    const el = document.querySelector(`.step-card[data-step="${step}"]`);
    if (!el) return;

    if (data.status === 'running') {
        for (let i = 1; i < step; i++) {
            const prev = document.querySelector(`.step-card[data-step="${i}"]`);
            if (prev) { prev.classList.remove('active'); prev.classList.add('done'); }
        }
        el.classList.add('active');
        el.classList.add('aos-visible'); // ensure visible
        currentStep = step;
        if (data.description) el.querySelector('.step-desc').textContent = data.description;

        const progress = Math.min(step * 20, 90);
        const labels = ['', 'Fetching data...', 'Analyzing waste...', 'Generating YAML...', 'Validating...', 'Creating MR...'];
        updateForestBar(progress, labels[step] || '');

        // Assistant context per step
        const stepMsgs = {
            1: '📡 Fetching pipeline data from GitLab API...',
            2: '🔍 Gemini 2.5 Flash is analyzing waste patterns...',
            3: '⚙️ Generating optimized <code>rules:changes:</code> blocks...',
            4: '🔧 Validating the new YAML with GitLab CI Linter...',
            5: '📤 Creating branch and merge request...',
        };
        if (stepMsgs[step]) addAssistantMsg(stepMsgs[step]);

    } else if (data.status === 'done') {
        el.classList.remove('active');
        el.classList.add('done');
        if (data.detail) {
            const logs = el.querySelector(`#step-${step}-logs`);
            if (step === 1 && data.detail.commits) {
                addLogTo(logs, `✅ ${data.detail.commits} commits fetched`);
                addLogTo(logs, `✅ ${data.detail.tree_items} repo items mapped`);
            }
            if (step === 2 && data.detail.jobs_count) {
                addLogTo(logs, `✅ Found ${data.detail.jobs_count} wasteful jobs`);
                addAssistantMsg(`Found <strong>${data.detail.jobs_count} wasteful jobs</strong> that can be skipped.`);
            }
            if (step === 4) {
                addLogTo(logs, data.detail.valid ? '✅ YAML is valid' : '⚠️ Validation issues');
            }
        }
    }
}

function addLog(msg) {
    const logs = document.getElementById(`step-${currentStep}-logs`);
    if (logs) addLogTo(logs, `✅ ${msg}`);
}

function addLogTo(container, text) {
    const div = document.createElement('div');
    div.className = 'log-line';
    div.textContent = text;
    container.appendChild(div);
}

// ── Show Results ────────────────────────────────────────
function showResults(data) {
    lastResultData = data;

    document.querySelectorAll('.step-card').forEach(el => {
        el.classList.remove('active');
        el.classList.add('done');
    });

    setStatus('ready', 'Complete');
    updateForestBar(100, '🌲 Forest fully grown!');
    document.getElementById('nav-results').style.display = 'inline';

    // Kick off the growing tree
    growTree(data);

    // Assistant celebration
    const m = data.savings.monthly;
    addAssistantMsg(`🎉 <strong>Analysis complete!</strong> Saved <strong>${m.minutes_saved} min/month</strong>, <strong>${m.co2_avoided_kg} kg CO₂</strong>, equivalent to <strong>${m.trees_equivalent} trees</strong>.`);
}

// ══════════════════════════════════════════════════════
//  Growing Tree — Phased Animation
// ══════════════════════════════════════════════════════
function growTree(data) {
    const container = document.getElementById('growing-tree');
    container.style.display = 'block';

    const m = data.savings.monthly;
    const hasMR = !!data.mr_url;
    const speed = reduceMotion ? 0.05 : 1;

    // Populate text panels (hidden for now)
    document.getElementById('ti-minutes').textContent = m.minutes_saved;
    document.getElementById('ti-energy').textContent = m.energy_saved_kwh + ' kWh';
    document.getElementById('ti-co2').textContent = m.co2_avoided_kg + ' kg';
    document.getElementById('ti-trees').textContent = m.trees_equivalent;
    document.getElementById('tc-minutes').textContent = m.minutes_saved;
    document.getElementById('tc-co2').textContent = m.co2_avoided_kg + ' kg';

    if (data.mr_url) {
        document.getElementById('tree-mr-link').href = data.mr_url;
        document.getElementById('tree-mr-link').style.display = 'inline-flex';
    }

    // Phase 1 (0.2s): Trunk grows
    setTimeout(() => {
        const trunk = document.getElementById('tree-trunk');
        trunk.setAttribute('height', '170');
        trunk.setAttribute('y', '140');
        trunk.classList.add('grow');
    }, 200 * speed);

    // Phase 2 (0.8s): Roots
    setTimeout(() => {
        document.querySelectorAll('.tree-root').forEach(r => r.classList.add('show'));
    }, 800 * speed);

    // Phase 3 (1.5–2.5s): Canopy layers
    setTimeout(() => document.querySelector('.canopy.c1').classList.add('grow'), 1500 * speed);
    setTimeout(() => document.querySelector('.canopy.c2').classList.add('grow'), 2000 * speed);
    setTimeout(() => document.querySelector('.canopy.c3').classList.add('grow'), 2500 * speed);

    // Phase 4 (3s): Ground glow + cumulative rings
    setTimeout(() => {
        document.querySelector('.tree-ground').classList.add('glow');
        document.querySelectorAll('.tree-ring').forEach(r => r.classList.add('show'));
    }, 3000 * speed);

    // Phase 5 (3–4s): Leaves
    document.querySelectorAll('.leaf').forEach((l, i) => {
        setTimeout(() => l.classList.add('show'), (3000 + i * 200) * speed);
    });

    // Phase 6 (3.5s): Impact text panel
    setTimeout(() => {
        document.getElementById('tree-waiting').style.display = 'none';
        document.getElementById('tree-impact').style.display = 'block';
    }, 3500 * speed);

    // Phase 7 (5s): Success halo + complete panel
    setTimeout(() => {
        // Halo burst
        const halo = document.getElementById('success-halo');
        halo.setAttribute('r', '100');
        halo.setAttribute('opacity', '0.3');
        setTimeout(() => { halo.setAttribute('opacity', '0'); }, 900 * speed);

        // Swap to complete panel
        document.getElementById('tree-impact').style.display = 'none';
        document.getElementById('tree-complete').style.display = 'block';
    }, 5000 * speed);

    // Phase 8 (8s): Transition to full results
    setTimeout(() => {
        document.getElementById('progress-section').style.display = 'none';
        document.getElementById('results-section').style.display = 'block';
        populateResults(data);
        // Trigger AOS on results
        document.querySelectorAll('.aos:not(.aos-visible)').forEach(el => el.classList.add('aos-visible'));
    }, 8000 * speed);
}

// ── Show Results Page (from CTA) ────────────────────────
function showResultsPage() {
    if (!lastResultData) return;
    document.getElementById('progress-section').style.display = 'none';
    document.getElementById('hero-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'block';
    populateResults(lastResultData);
    document.querySelectorAll('.aos:not(.aos-visible)').forEach(el => el.classList.add('aos-visible'));
    // Activate Results nav
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.getElementById('nav-results').classList.add('active');
}

// ── Populate Results ────────────────────────────────────
function populateResults(data) {
    const m = data.savings.monthly;
    const a = data.savings.annual;
    const metrics = data.metrics;

    document.getElementById('results-project').textContent =
        `${data.project} · ${data.commits_analyzed} commits · ${data.jobs_optimized} jobs optimized`;

    animateCounter('metric-minutes', 0, m.minutes_saved, 0);
    animateCounter('metric-cost', 0, m.cost_saved, 2, '$');
    animateCounter('metric-co2', 0, m.co2_avoided_kg, 2);
    animateCounter('metric-trees', 0, m.trees_equivalent, 2);
    animateCounter('metric-energy', 0, m.energy_saved_kwh, 2);
    animateCounter('metric-waste-pct', 0, metrics.waste_percentage, 0);

    document.getElementById('tbl-monthly-minutes').textContent = `${m.minutes_saved} min`;
    document.getElementById('tbl-annual-hours').textContent = `${a.hours_saved} hrs`;
    document.getElementById('tbl-monthly-cost').textContent = `$${m.cost_saved}`;
    document.getElementById('tbl-annual-cost').textContent = `$${a.cost_saved}`;
    document.getElementById('tbl-monthly-co2').textContent = `${m.co2_avoided_kg} kg`;
    document.getElementById('tbl-annual-co2').textContent = `${a.co2_avoided_kg} kg`;
    document.getElementById('tbl-monthly-energy').textContent = `${m.energy_saved_kwh} kWh`;
    document.getElementById('tbl-annual-energy').textContent = `${(m.energy_saved_kwh * 12).toFixed(1)} kWh`;
    document.getElementById('tbl-monthly-trees').textContent = `${m.trees_equivalent}`;
    document.getElementById('tbl-annual-trees').textContent = `${a.trees_equivalent}`;

    document.getElementById('yaml-before').innerHTML = highlightYaml(data.original_yaml || '(not available)');
    document.getElementById('yaml-after').innerHTML = highlightYaml(data.optimized_yaml || '(not available)');
    document.getElementById('waste-detail').textContent = data.waste_analysis || '';

    // Remove skeleton loaders
    document.querySelectorAll('.kpi-card.skeleton').forEach(el => el.classList.remove('skeleton'));

    if (data.mr_url) {
        document.getElementById('mr-card').style.display = 'block';
        document.getElementById('mr-link').href = data.mr_url;
        document.getElementById('mr-trees').textContent = `+${m.trees_equivalent}`;
    }

    createWasteChart(metrics.waste_percentage);
    createSavingsChart(m, a);
    setTimeout(() => initTippy(), 500);
}

// ── Animated Counter ────────────────────────────────────
function animateCounter(id, start, end, decimals, prefix) {
    const el = document.getElementById(id);
    if (!el) return;
    prefix = prefix || '';
    const duration = reduceMotion ? 100 : 1500;
    const startTime = Date.now();
    function tick() {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * eased;
        el.textContent = prefix + current.toFixed(decimals);
        if (progress < 1) requestAnimationFrame(tick);
    }
    tick();
}

// ── Charts ──────────────────────────────────────────────
function createWasteChart(wastePct) {
    const ctx = document.getElementById('waste-chart');
    if (!ctx) return;
    if (wasteChart) wasteChart.destroy();
    wasteChart = new Chart(ctx, {
        type: 'doughnut',
        data: { labels: ['Wasted Runs', 'Useful Runs'],
            datasets: [{ data: [wastePct, 100 - wastePct],
                backgroundColor: ['rgba(239,68,68,0.7)', 'rgba(34,197,94,0.7)'],
                borderColor: ['rgba(239,68,68,1)', 'rgba(34,197,94,1)'],
                borderWidth: 1, hoverOffset: 6 }] },
        options: { responsive: true, maintainAspectRatio: false, cutout: '68%',
            plugins: { legend: { position: 'bottom', labels: { color: '#8ba898', font: { family: 'Inter', size: 11 }, padding: 14 } } },
            animation: { duration: reduceMotion ? 0 : 1500 } }
    });
}

function createSavingsChart(monthly, annual) {
    const ctx = document.getElementById('savings-chart');
    if (!ctx) return;
    if (savingsChart) savingsChart.destroy();
    savingsChart = new Chart(ctx, {
        type: 'bar',
        data: { labels: ['Cost ($)', 'Energy (kWh)', 'CO₂ (kg)'],
            datasets: [
                { label: 'Monthly', data: [monthly.cost_saved, monthly.energy_saved_kwh, monthly.co2_avoided_kg],
                  backgroundColor: 'rgba(34,197,94,0.6)', borderColor: 'rgba(34,197,94,1)', borderWidth: 1, borderRadius: 4 },
                { label: 'Annual', data: [annual.cost_saved, monthly.energy_saved_kwh * 12, annual.co2_avoided_kg],
                  backgroundColor: 'rgba(59,130,246,0.6)', borderColor: 'rgba(59,130,246,1)', borderWidth: 1, borderRadius: 4 }
            ] },
        options: { responsive: true, maintainAspectRatio: false,
            plugins: { legend: { position: 'bottom', labels: { color: '#8ba898', font: { family: 'Inter', size: 11 }, padding: 14 } } },
            scales: {
                x: { ticks: { color: '#4a6a5a', font: { size: 10 } }, grid: { color: 'rgba(34,197,94,0.04)' } },
                y: { ticks: { color: '#4a6a5a', font: { size: 10 } }, grid: { color: 'rgba(34,197,94,0.04)' } }
            },
            animation: { duration: reduceMotion ? 0 : 1500 } }
    });
}

// ── Helpers ─────────────────────────────────────────────
function showYamlTab(tab) {
    document.getElementById('yaml-before').style.display = tab === 'before' ? 'block' : 'none';
    document.getElementById('yaml-after').style.display = tab === 'after' ? 'block' : 'none';
    document.querySelectorAll('.tab-group .tab').forEach(el => el.classList.remove('active'));
    event.target.classList.add('active');
}

function updateForestBar(pct, label) {
    const fill = document.getElementById('forest-fill');
    const lbl = document.getElementById('forest-label');
    if (fill) fill.style.width = pct + '%';
    if (lbl) lbl.textContent = '🌱 ' + label;
}

function setStatus(state, text) {
    const dot = document.getElementById('status-dot');
    const txt = document.getElementById('status-text');
    dot.className = 'status-dot' + (state === 'running' ? ' running' : state === 'error' ? ' error' : '');
    txt.textContent = text;
}

function showError(msg) {
    document.getElementById('error-message').textContent = msg;
    document.getElementById('error-modal').style.display = 'flex';
}

function closeError() {
    document.getElementById('error-modal').style.display = 'none';
    resetUI();
}

function resetUI() {
    const btn = document.getElementById('btn-analyze');
    btn.disabled = false;
    btn.querySelector('.btn-text').textContent = 'Launch Analysis';
    document.getElementById('hero-section').style.display = 'block';
    document.getElementById('progress-section').style.display = 'none';
    document.getElementById('results-section').style.display = 'none';
    document.getElementById('growing-tree').style.display = 'none';
    setStatus('ready', 'Ready');
    updateForestBar(0, 'Ready to analyze');

    // Reset tree state
    document.querySelectorAll('.tree-trunk, .tree-root, .canopy, .leaf, .tree-ground, .tree-ring').forEach(el => {
        el.classList.remove('grow', 'show', 'glow');
    });
    const trunk = document.getElementById('tree-trunk');
    if (trunk) { trunk.setAttribute('height', '0'); trunk.setAttribute('y', '310'); }
    const halo = document.getElementById('success-halo');
    if (halo) { halo.setAttribute('r', '0'); halo.setAttribute('opacity', '0'); }

    // Remove skeleton loaders
    document.querySelectorAll('.kpi-card.skeleton').forEach(el => el.classList.remove('skeleton'));

    // Hide Results nav
    document.getElementById('nav-results').style.display = 'none';
    document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
    document.querySelector('.nav-link[data-page="home"]').classList.add('active');
}

// ── Run Again ───────────────────────────────────────────
function runAgain() {
    resetUI();
    lastResultData = null;
    // Clear assistant log (keep only the welcome messages)
    const body = document.getElementById('assistant-body');
    if (body) {
        const ctx = body.querySelectorAll('.assistant-ctx');
        ctx.forEach(el => el.remove());
    }
    // Scroll to top smoothly
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

// ── YAML Syntax Highlighting ────────────────────────────
function highlightYaml(text) {
    if (!text) return '';
    // Escape HTML
    const escaped = text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    // Process line by line
    return escaped.split('\n').map(line => {
        // Full-line comment
        if (/^\s*#/.test(line)) {
            return `<span class="yaml-comment">${line}</span>`;
        }
        // Inline comment
        let mainPart = line;
        let commentPart = '';
        const commentMatch = line.match(/^(.*?)(\s+#.*)$/);
        if (commentMatch) {
            mainPart = commentMatch[1];
            commentPart = `<span class="yaml-comment">${commentMatch[2]}</span>`;
        }
        // Key: value pairs
        const kvMatch = mainPart.match(/^(\s*)(- )?([\w][\w.\-\/\*]*)(:\s*)(.*)$/);
        if (kvMatch) {
            const [, indent, dash, key, colon, value] = kvMatch;
            const dashHtml = dash ? `<span class="yaml-dash">${dash}</span>` : '';
            const valHtml = highlightYamlValue(value);
            return `${indent}${dashHtml}<span class="yaml-key">${key}</span>${colon}${valHtml}${commentPart}`;
        }
        // Bare dash list items
        const dashMatch = mainPart.match(/^(\s*)(- )(.*)$/);
        if (dashMatch) {
            const [, indent, dash, value] = dashMatch;
            return `${indent}<span class="yaml-dash">${dash}</span>${highlightYamlValue(value)}${commentPart}`;
        }
        return mainPart + commentPart;
    }).join('\n');
}

function highlightYamlValue(val) {
    if (!val) return '';
    // Quoted strings
    if (/^['"].*['"]$/.test(val)) return `<span class="yaml-string">${val}</span>`;
    // Booleans
    if (/^(true|false|yes|no|on|off)$/i.test(val)) return `<span class="yaml-bool">${val}</span>`;
    // Numbers
    if (/^[\d.]+$/.test(val)) return `<span class="yaml-number">${val}</span>`;
    return `<span class="yaml-value">${val}</span>`;
}

// ── Skeleton Loaders ────────────────────────────────────
function addSkeletons() {
    document.querySelectorAll('.kpi-card').forEach(el => el.classList.add('skeleton'));
}

function removeSkeletons() {
    document.querySelectorAll('.kpi-card.skeleton').forEach(el => el.classList.remove('skeleton'));
}

// ── Nav Page Switching ──────────────────────────────────
document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const page = link.dataset.page;
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        if (page === 'home') {
            document.getElementById('hero-section').style.display = 'block';
            document.getElementById('results-section').style.display = 'none';
            document.getElementById('progress-section').style.display = 'none';
        } else if (page === 'results') {
            document.getElementById('hero-section').style.display = 'none';
            document.getElementById('progress-section').style.display = 'none';
            document.getElementById('results-section').style.display = 'block';
        }
    });
});

import { DataLoader } from './data-loader.js';
import { QuickInsights } from './charts/quick-insights.js';
import { Histogram } from './charts/histogram.js';
import { SmokerBoxPlot } from './charts/boxplot.js';

// Constants
const DATA_PATH = 'data/medical-charges.csv';

// State
let appState = {
    data: [], // Original full dataset
    filteredData: [],
    filters: {
        sex: ['male', 'female'],
        smoker: ['yes', 'no'],
        regions: [],
        age: [18, 64],
        bmi: [15, 54]
    }
};

// UI References
const ui = {
    kpiCharges: document.querySelector('#kpi-charges .kpi-value'),
    kpiPatients: document.querySelector('#kpi-patients .kpi-value'),
    kpiSmokers: document.querySelector('#kpi-smokers .kpi-value'),
    kpiBmi: document.querySelector('#kpi-bmi .kpi-value'),
    regionFilterContainer: document.getElementById('region-filters'),
    resetBtn: document.querySelector('.reset-btn')
};

// Charts
const charts = {
    insights: new QuickInsights('quick-insights'),
    histogram: new Histogram('chart-histogram'),
    boxplot: new SmokerBoxPlot('chart-boxplot')
};

// Initialization
async function init() {
    try {
        const loader = new DataLoader(DATA_PATH);
        appState.data = await loader.loadData();
        appState.filteredData = appState.data;

        // Initialize filter state with all regions
        appState.filters.regions = [...new Set(appState.data.map(d => d.region))];

        // Initial Render
        populateFilters();
        renderDashboard(loader);
        setupEventListeners(loader);
        animateEntrance();

    } catch (err) {
        console.error("Initialization failed:", err);
        // Add minimal error handling UI
        document.body.innerHTML = `<div style="padding: 2rem; color: #ef4444;">Error loading data: ${err.message}. Please ensure the file is served via a local server (e.g. Live Server).</div>`;
    }
}

function setupEventListeners(loader) {
    // Listen for any checkbox changes
    document.querySelector('.sidebar').addEventListener('change', (e) => {
        if (e.target.type === 'checkbox') {
            updateFilterState();
            applyFilters(loader);
        }
    });

    // Reset Button
    ui.resetBtn.addEventListener('click', () => {
        resetFilters(loader);
    });
}

function updateFilterState() {
    // Collect values from checkboxes
    appState.filters.sex = Array.from(document.querySelectorAll('input[name="sex"]:checked')).map(cb => cb.value);
    appState.filters.smoker = Array.from(document.querySelectorAll('input[name="smoker"]:checked')).map(cb => cb.value);
    appState.filters.regions = Array.from(document.querySelectorAll('input[name="region"]:checked')).map(cb => cb.value);
}

function applyFilters(loader) {
    appState.filteredData = appState.data.filter(d => {
        const matchesSex = appState.filters.sex.includes(d.sex);
        const matchesSmoker = appState.filters.smoker.includes(d.smoker);
        const matchesRegion = appState.filters.regions.includes(d.region);
        const matchesAge = d.age >= appState.filters.age[0] && d.age <= appState.filters.age[1];
        const matchesBmi = d.bmi >= appState.filters.bmi[0] && d.bmi <= appState.filters.bmi[1];

        return matchesSex && matchesSmoker && matchesRegion && matchesAge && matchesBmi;
    });

    renderDashboard(loader);
}

function resetFilters(loader) {
    // Reset checkboxes
    document.querySelectorAll('.sidebar input[type="checkbox"]').forEach(cb => cb.checked = true);

    // Reset state
    updateFilterState();

    // Apply
    applyFilters(loader);
}

function renderDashboard(loader) {
    const stats = loader.getStats(appState.filteredData);

    // We update innerHTML to 0 first to animate from 0
    // Actually, Anime.js can handle the counting from 0

    // Animate Numbers
    animateNumber(ui.kpiCharges, stats.avgCharges, '$', 0);
    animateNumber(ui.kpiPatients, stats.totalPatients, '', 0);
    animateNumber(ui.kpiSmokers, stats.smokerPercentage, '', 1, '%');
    animateNumber(ui.kpiBmi, stats.avgBmi, '', 1);

    // Render Charts
    charts.insights.render(stats);
    charts.histogram.render(appState.filteredData);
    charts.boxplot.render(appState.filteredData);
}

function populateFilters() {
    // Unique regions
    const regions = [...new Set(appState.data.map(d => d.region))];

    ui.regionFilterContainer.innerHTML = regions.map(region => `
        <label class="checkbox-item">
            <input type="checkbox" checked value="${region}" name="region">
            <span class="checkmark"></span>
            <span class="checkbox-label">${capitalizeFirstLetter(region)}</span>
        </label>
    `).join('');
}

function animateEntrance() {
    // Stagger KPI Cards
    anime({
        targets: '.kpi-card',
        translateY: [50, 0],
        opacity: [0, 1],
        delay: anime.stagger(100, { start: 200 }),
        easing: 'easeOutExpo',
        duration: 800
    });

    // Fade in layout
    anime({
        targets: ['.sidebar', '.charts-grid'],
        opacity: [0, 1],
        easing: 'linear',
        duration: 500,
        delay: 500
    });
}

function animateNumber(el, value, prefix = '', decimals = 0, suffix = '') {
    const obj = { val: 0 };
    anime({
        targets: obj,
        val: value,
        easing: 'easeOutExpo',
        duration: 2000,
        round: 100, // Update frequently
        update: function () {
            // Format number
            let formatted = obj.val.toLocaleString('en-US', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
            el.textContent = `${prefix}${formatted}${suffix}`;
        }
    });
}

function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Start
init();

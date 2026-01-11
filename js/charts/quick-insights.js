export class QuickInsights {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }

    render(stats) {
        if (!this.container) return;

        // Clear existing (if we want to full re-render, though for now we have static structure)
        // For MVP, we'll just update the text values we know exist

        // In a real mini-chart implementation, we would append SVG elements here

        // Update Insight: Highest Cost Factor
        // For this distinct dataset, we know it's smoking, but we could make it dynamic
        // const highestFactor = "Smoking Status"; 

        // Update Insight: Most Expensive Region
        const regionEl = document.getElementById('insight-region');
        if (regionEl && stats.mostExpensiveRegion) {
            regionEl.textContent = this._capitalize(stats.mostExpensiveRegion);
        }

        // Future: Render Pie Chart
        // Future: Render Age Histogram
    }

    _capitalize(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }
}

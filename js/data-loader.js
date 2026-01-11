/**
 * Handles data loading and processing for the Medical Charges dashboard.
 */
export class DataLoader {
    constructor(csvPath) {
        this.csvPath = csvPath;
        this.data = null;
    }

    /**
     * Loads and parses the CSV data
     * @returns {Promise<Array>} Parsed data
     */
    async loadData() {
        try {
            this.data = await d3.csv(this.csvPath, this._typeConversion);
            return this.data;
        } catch (error) {
            console.error("Error loading data:", error);
            throw error;
        }
    }

    /**
     * D3 row conversion function to ensure correct types
     */
    _typeConversion(d) {
        return {
            age: +d.age,
            sex: d.sex,
            bmi: +d.bmi,
            children: +d.children,
            smoker: d.smoker,
            region: d.region,
            charges: +d.charges
        };
    }

    /**
     * Get summary statistics for KPIs
     */
    getStats(filteredData = null) {
        const data = filteredData || this.data;
        if (!data) return null;

        const totalPatients = data.length;
        const avgCharges = d3.mean(data, d => d.charges);
        const avgBmi = d3.mean(data, d => d.bmi);
        
        const smokerCount = data.filter(d => d.smoker === 'yes').length;
        const smokerPercentage = (smokerCount / totalPatients) * 100;

        // Find most expensive region
        const regionGroups = d3.rollup(data, v => d3.mean(v, d => d.charges), d => d.region);
        const sortedRegions = Array.from(regionGroups).sort((a, b) => b[1] - a[1]);
        const mostExpensiveRegion = sortedRegions.length > 0 ? sortedRegions[0][0] : 'N/A';

        return {
            totalPatients,
            avgCharges,
            avgBmi,
            smokerPercentage,
            mostExpensiveRegion
        };
    }
}

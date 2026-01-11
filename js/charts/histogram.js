export class Histogram {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.svg = null;
        this.width = 0;
        this.height = 0;
        this.margin = { top: 20, right: 30, bottom: 70, left: 60 };

        // Initialize resize listener (basic version for now)
        window.addEventListener('resize', () => {
            if (this.data) this.render(this.data);
        });
    }

    render(data) {
        if (!this.container || !data) return;
        this.data = data;

        // Get dimensions
        const rect = this.container.getBoundingClientRect();
        this.width = rect.width - this.margin.left - this.margin.right;
        this.height = rect.height - this.margin.top - this.margin.bottom;

        if (this.width <= 0 || this.height <= 0) return;

        // Create or select SVG
        if (!this.svg) {
            this.svg = d3.select(`#${this.containerId}`)
                .append("svg")
                .attr("width", rect.width)
                .attr("height", rect.height)
                .append("g")
                .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

            // Initial Axis Containers
            this.svg.append("g").attr("class", "x-axis");
            this.svg.append("g").attr("class", "y-axis");

            // Clipping path
            this.svg.append("defs").append("clipPath")
                .attr("id", "histogram-clip")
                .append("rect")
                .attr("width", this.width)
                .attr("height", this.height);

            // Static Gradients
            const gradientId = "bar-gradient";
            const defs = this.svg.select("defs");
            const gradient = defs.append("linearGradient")
                .attr("id", gradientId)
                .attr("x1", "0%")
                .attr("y1", "100%")
                .attr("x2", "0%")
                .attr("y2", "0%");

            gradient.append("stop").attr("offset", "0%").attr("stop-color", "#6366f1");
            gradient.append("stop").attr("offset", "100%").attr("stop-color", "#8b5cf6");
        } else {
            // Update SVG dimensions on resize
            d3.select(`#${this.containerId} svg`)
                .attr("width", rect.width)
                .attr("height", rect.height);

            this.svg.select("#histogram-clip rect")
                .attr("width", this.width)
                .attr("height", this.height);
        }

        // X Axis Scale
        const x = d3.scaleLinear()
            .domain([0, d3.max(this.data, d => d.charges) || 1000])
            .range([0, this.width]);

        this.svg.select(".x-axis")
            .attr("transform", `translate(0,${this.height})`) // Ensure it's always at the bottom
            .transition().duration(500)
            .call(d3.axisBottom(x).ticks(5).tickFormat(d => `$${d / 1000}k`))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("line").attr("stroke", "rgba(255,255,255,0.1)"))
            .call(g => g.selectAll("text").attr("fill", "rgba(255,255,255,0.5)"));

        // Histogram Bins
        const histogram = d3.bin()
            .value(d => d.charges)
            .domain(x.domain())
            .thresholds(x.ticks(20));

        const bins = histogram(this.data);

        // Y Axis Scale
        const y = d3.scaleLinear()
            .domain([0, (d3.max(bins, d => d.length) || 10) * 1.1]) // Add 10% padding
            .range([this.height, 0]);

        this.svg.select(".y-axis")
            .transition().duration(500)
            .call(d3.axisLeft(y).ticks(5))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("line").remove())
            .call(g => g.selectAll("text").attr("fill", "rgba(255,255,255,0.5)"));

        // Bars with clipping
        const bars = this.svg.selectAll(".bar")
            .data(bins);

        bars.exit().remove();

        bars.enter()
            .append("rect")
            .attr("class", "bar")
            .attr("clip-path", "url(#histogram-clip)")
            .attr("fill", "url(#bar-gradient)")
            .attr("x", d => x(d.x0) + 1)
            .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
            .attr("y", this.height)
            .attr("height", 0)
            .style("opacity", 0.9)
            .on("mouseover", (event, d) => this.showTooltip(event, d))
            .on("mouseout", () => this.hideTooltip())
            .merge(bars)
            .transition()
            .duration(800)
            .attr("x", d => x(d.x0) + 1)
            .attr("width", d => Math.max(0, x(d.x1) - x(d.x0) - 1))
            .attr("y", d => y(d.length))
            .attr("height", d => Math.max(0, this.height - y(d.length)));
    }

    showTooltip(event, d) {
        const tooltip = document.getElementById('tooltip') || this.createTooltip();
        const count = d.length;
        const range = `$${Math.round(d.x0 / 1000)}k - $${Math.round(d.x1 / 1000)}k`;

        tooltip.style.opacity = 1;
        tooltip.innerHTML = `
            <div class="tooltip-title">Charges Range</div>
            <div class="tooltip-range">${range}</div>
            <div class="tooltip-value">${count} Patients</div>
        `;

        // Position
        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - 10}px`;
    }

    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) tooltip.style.opacity = 0;
    }

    createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.id = 'tooltip';
        document.body.appendChild(tooltip);
        return tooltip;
    }
}

export class SmokerBoxPlot {
    constructor(containerId) {
        this.containerId = containerId;
        this.container = document.getElementById(containerId);
        this.svg = null;
        this.margin = { top: 20, right: 30, bottom: 70, left: 60 };

        window.addEventListener('resize', () => {
            if (this.data) this.render(this.data);
        });
    }

    render(data) {
        if (!this.container || !data) return;
        this.data = data;

        // Dimensions
        const rect = this.container.getBoundingClientRect();
        const width = rect.width - this.margin.left - this.margin.right;
        const height = rect.height - this.margin.top - this.margin.bottom;

        if (width <= 0 || height <= 0) return;

        // Create or select SVG
        if (!this.svg) {
            this.svg = d3.select(`#${this.containerId}`)
                .append("svg")
                .attr("width", rect.width)
                .attr("height", rect.height)
                .append("g")
                .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

            this.svg.append("g").attr("class", "x-axis");
            this.svg.append("g").attr("class", "y-axis");
        } else {
            d3.select(`#${this.containerId} svg`)
                .attr("width", rect.width)
                .attr("height", rect.height);
        }

        // Compute Quartiles
        const sumstat = d3.rollup(this.data, (d) => {
            const charges = d.map(g => g.charges).sort(d3.ascending);
            const q1 = d3.quantile(charges, .25) || 0;
            const median = d3.quantile(charges, .5) || 0;
            const q3 = d3.quantile(charges, .75) || 0;
            const interQuantileRange = q3 - q1;
            const min = d3.min(charges) || 0;
            const max = d3.max(charges) || 0;

            const minWhisker = Math.max(min, q1 - 1.5 * interQuantileRange);
            const maxWhisker = Math.min(max, q3 + 1.5 * interQuantileRange);

            return { q1, median, q3, interQuantileRange, min: minWhisker, max: maxWhisker };
        }, d => d.smoker);

        // Scales
        const x = d3.scaleBand()
            .range([0, width])
            .domain(["yes", "no"])
            .paddingInner(1)
            .paddingOuter(.5);

        const y = d3.scaleLinear()
            .domain([0, (d3.max(this.data, d => d.charges) || 10000) * 1.05])
            .range([height, 0]);

        // Axes
        this.svg.select(".x-axis")
            .attr("transform", `translate(0,${height})`)
            .transition().duration(500)
            .call(d3.axisBottom(x).tickFormat(d => d === "yes" ? "Smoker" : "Non-Smoker"))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("text").attr("fill", "rgba(255,255,255,0.7)").style("font-size", "14px"));

        this.svg.select(".y-axis")
            .transition().duration(500)
            .call(d3.axisLeft(y).ticks(5).tickFormat(d => `$${d / 1000}k`))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("line").attr("stroke", "rgba(255,255,255,0.1)"))
            .call(g => g.selectAll("text").attr("fill", "rgba(255,255,255,0.5)"));

        // Colors
        const color = d3.scaleOrdinal()
            .domain(["yes", "no"])
            .range(["#ef4444", "#10b981"]);

        const boxWidth = 60;

        // Vertical Lines
        const vertLines = this.svg.selectAll(".vert-line")
            .data(sumstat, d => d[0]);

        vertLines.exit().remove();
        vertLines.enter()
            .append("line")
            .attr("class", "vert-line")
            .attr("stroke", "rgba(255,255,255,0.3)")
            .merge(vertLines)
            .transition().duration(800)
            .attr("x1", d => x(d[0]))
            .attr("x2", d => x(d[0]))
            .attr("y1", d => y(d[1].min))
            .attr("y2", d => y(d[1].max));

        // Boxes
        const boxes = this.svg.selectAll(".box")
            .data(sumstat, d => d[0]);

        boxes.exit().remove();
        boxes.enter()
            .append("rect")
            .attr("class", "box")
            .style("fill", d => color(d[0]))
            .style("opacity", 0.3)
            .attr("stroke", d => color(d[0]))
            .on("mouseover", (event, d) => this.showTooltip(event, d))
            .on("mouseout", () => this.hideTooltip())
            .merge(boxes)
            .transition().duration(800)
            .attr("x", d => x(d[0]) - boxWidth / 2)
            .attr("y", d => y(d[1].q3))
            .attr("height", d => Math.max(0, y(d[1].q1) - y(d[1].q3)))
            .attr("width", boxWidth);

        // Median Lines
        const medianLines = this.svg.selectAll(".median-line")
            .data(sumstat, d => d[0]);

        medianLines.exit().remove();
        medianLines.enter()
            .append("line")
            .attr("class", "median-line")
            .attr("stroke-width", 2)
            .attr("stroke", d => color(d[0]))
            .merge(medianLines)
            .transition().duration(800)
            .attr("x1", d => x(d[0]) - boxWidth / 2)
            .attr("x2", d => x(d[0]) + boxWidth / 2)
            .attr("y1", d => y(d[1].median))
            .attr("y2", d => y(d[1].median));
    }

    showTooltip(event, d) {
        // d is [key, value]
        const stats = d[1];
        const status = d[0] === 'yes' ? 'Smoker' : 'Non-Smoker';

        const tooltip = document.getElementById('tooltip') || this.createTooltip();
        tooltip.style.opacity = 1;
        tooltip.innerHTML = `
            <div class="tooltip-title">${status}</div>
            <div class="tooltip-item">Median: <b>$${Math.round(stats.median).toLocaleString()}</b></div>
            <div class="tooltip-item">Q1: $${Math.round(stats.q1).toLocaleString()}</div>
            <div class="tooltip-item">Q3: $${Math.round(stats.q3).toLocaleString()}</div>
        `;

        const rect = event.target.getBoundingClientRect();
        tooltip.style.left = `${rect.left + rect.width / 2}px`;
        tooltip.style.top = `${rect.top - 10}px`;
    }

    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) tooltip.style.opacity = 0;
    }

    createTooltip() {
        const t = document.createElement('div');
        t.id = 'tooltip';
        document.body.appendChild(t);
        return t;
    }
}

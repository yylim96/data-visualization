/**
 * Simple Range Slider using D3.js
 */
export class RangeSlider {
    constructor(containerId, options = {}) {
        this.container = d3.select(`#${containerId}`);
        this.min = options.min || 0;
        this.max = options.max || 100;
        this.step = options.step || 1;
        this.values = options.values || [this.min, this.max];
        this.onChange = options.onChange || (() => { });
        this.onInput = options.onInput || (() => { });

        this.width = this.container.node().getBoundingClientRect().width;
        this.margin = { left: 8, right: 8 };
        this.innerWidth = this.width - this.margin.left - this.margin.right;

        this.scale = d3.scaleLinear()
            .domain([this.min, this.max])
            .range([0, this.innerWidth])
            .clamp(true);

        this.init();
    }

    init() {
        // Clear any existing content
        this.container.selectAll('.slider-track, .slider-handle, .slider-selection').remove();

        const trackContainer = this.container.append('div')
            .attr('class', 'slider-track')
            .style('margin', `0 ${this.margin.left}px`);

        this.selection = trackContainer.append('div')
            .attr('class', 'slider-selection');

        this.handles = [
            { index: 0, value: this.values[0] },
            { index: 1, value: this.values[1] }
        ];

        this.handleEls = this.container.selectAll('.slider-handle')
            .data(this.handles)
            .enter()
            .append('div')
            .attr('class', 'slider-handle')
            .call(d3.drag()
                .on('start', function () { d3.select(this).classed('dragging', true); })
                .on('drag', (event, d) => this.dragged(event, d))
                .on('end', function () { d3.select(this).classed('dragging', false); })
            );

        this.update();
    }

    dragged(event, d) {
        const x = event.x - this.margin.left;
        let newValue = this.scale.invert(x);

        // Snap to step
        newValue = Math.round(newValue / this.step) * this.step;

        // Constraint handles
        if (d.index === 0) {
            newValue = Math.min(newValue, this.values[1] - this.step);
        } else {
            newValue = Math.max(newValue, this.values[0] + this.step);
        }

        this.values[d.index] = newValue;
        this.update();
        this.onInput(this.values);
        this.onChange(this.values); // In a real app we might debounce change but for now this is fine
    }

    update() {
        const x0 = this.scale(this.values[0]);
        const x1 = this.scale(this.values[1]);

        this.handleEls.filter(d => d.index === 0)
            .style('left', `${x0 + this.margin.left}px`);

        this.handleEls.filter(d => d.index === 1)
            .style('left', `${x1 + this.margin.left}px`);

        this.selection
            .style('left', `${x0}px`)
            .style('width', `${x1 - x0}px`);
    }

    reset(values) {
        this.values = values || [this.min, this.max];
        this.update();
    }
}

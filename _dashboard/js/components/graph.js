/**
 * Graph View Component
 * 전략 계층 그래프 시각화 (D3.js 기반)
 */
const Graph = {
    svg: null,
    simulation: null,
    nodes: [],
    links: [],
    selectedNode: null,
    zoom: null,
    g: null,  // Main group for zoom/pan

    // Layer Y positions (percentage of height)
    layers: {
        northstar: 0.05,        // North Star (10-year vision)
        metahypothesis: 0.18,   // Meta Hypotheses (MH1-4)
        strategy: 0.38,         // Condition, ProductLine, PartnershipStage
        track: 0.60,            // Tracks (1-6)
        execution: 0.82         // Project, Hypothesis
    },

    // Node styling
    nodeConfig: {
        NorthStar: { color: '#fbbf24', icon: '⭐', radius: 32, layer: 'northstar' },
        MetaHypothesis: { color: '#ec4899', icon: '🧬', radius: 26, layer: 'metahypothesis' },
        Condition: { color: '#f97316', icon: '🔑', radius: 24, layer: 'strategy' },
        ProductLine: { color: '#06b6d4', icon: '📦', radius: 24, layer: 'strategy' },
        PartnershipStage: { color: '#8b5cf6', icon: '🤝', radius: 24, layer: 'strategy' },
        Track: { color: '#238636', icon: '🎯', radius: 22, layer: 'track' },
        Project: { color: '#1f6feb', icon: '📁', radius: 20, layer: 'execution' },
        Hypothesis: { color: '#a371f7', icon: '💡', radius: 20, layer: 'execution' }
    },

    // ============================================
    // Initialization
    // ============================================
    init() {
        this.setupZoom();
    },

    setupZoom() {
        this.zoom = d3.zoom()
            .scaleExtent([0.3, 3])
            .on('zoom', (event) => {
                if (this.g) {
                    this.g.attr('transform', event.transform);
                }
            });
    },

    // ============================================
    // Data Preparation
    // ============================================
    prepareData() {
        this.nodes = [];
        this.links = [];

        const nodeMap = new Map();

        console.log('Graph prepareData:');
        console.log('  NorthStars:', State.northstars?.length || 0);
        console.log('  MetaHypotheses:', State.metahypotheses?.length || 0);
        console.log('  Conditions-', State.conditions?.length || 0);
        console.log('  ProductLines:', State.productlines?.length || 0);
        console.log('  PartnershipStages:', State.partnershipstages?.length || 0);
        console.log('  Tracks:', State.tracks?.length || 0);
        console.log('  Projects:', State.projects?.length || 0);
        console.log('  Hypotheses:', State.hypotheses?.length || 0);

        // ========== L0: NorthStar ==========
        (State.northstars || []).forEach(ns => {
            const node = {
                id: ns.entity_id,
                type: 'NorthStar',
                name: ns.entity_name || ns.vision || ns.entity_id,
                data: ns,
                ...this.nodeConfig.NorthStar
            };
            this.nodes.push(node);
            nodeMap.set(ns.entity_id, node);
        });

        // ========== L1: MetaHypotheses ==========
        (State.metahypotheses || []).forEach(mh => {
            const node = {
                id: mh.entity_id,
                type: 'MetaHypothesis',
                name: mh.entity_name || mh.entity_id,
                data: mh,
                ...this.nodeConfig.MetaHypothesis
            };
            this.nodes.push(node);
            nodeMap.set(mh.entity_id, node);

            // Link MH to parent NorthStar
            if (mh.parent_id && nodeMap.has(mh.parent_id)) {
                this.links.push({
                    source: mh.parent_id,
                    target: mh.entity_id,
                    type: 'validates'
                });
            }
        });

        // ========== L2: Conditions ==========
        (State.conditions || []).forEach(cond => {
            const node = {
                id: cond.entity_id,
                type: 'Condition',
                name: cond.entity_name || cond.entity_id,
                data: cond,
                ...this.nodeConfig.Condition
            };
            this.nodes.push(node);
            nodeMap.set(cond.entity_id, node);

            // Link Condition to parent MH
            if (cond.parent_id && nodeMap.has(cond.parent_id)) {
                this.links.push({
                    source: cond.parent_id,
                    target: cond.entity_id,
                    type: 'enables'
                });
            }
        });

        // ========== L2: ProductLines ==========
        (State.productlines || []).forEach(pl => {
            const node = {
                id: pl.entity_id,
                type: 'ProductLine',
                name: pl.entity_name || pl.entity_id,
                data: pl,
                ...this.nodeConfig.ProductLine
            };
            this.nodes.push(node);
            nodeMap.set(pl.entity_id, node);

            // Link ProductLine to parent Condition
            if (pl.parent_id && nodeMap.has(pl.parent_id)) {
                this.links.push({
                    source: pl.parent_id,
                    target: pl.entity_id,
                    type: 'enables'
                });
            }

            // ProductLine outgoing relations (e.g., PL3 → PL5)
            if (pl.outgoing_relations) {
                pl.outgoing_relations.forEach(rel => {
                    if (nodeMap.has(rel.target_id)) {
                        this.links.push({
                            source: pl.entity_id,
                            target: rel.target_id,
                            type: rel.type || 'enables'
                        });
                    }
                });
            }
        });

        // ========== L2: PartnershipStages ==========
        (State.partnershipstages || []).forEach(ps => {
            const node = {
                id: ps.entity_id,
                type: 'PartnershipStage',
                name: ps.entity_name || ps.entity_id,
                data: ps,
                ...this.nodeConfig.PartnershipStage
            };
            this.nodes.push(node);
            nodeMap.set(ps.entity_id, node);

            // Link PartnershipStage to parent (Condition or ProductLine)
            if (ps.parent_id && nodeMap.has(ps.parent_id)) {
                this.links.push({
                    source: ps.parent_id,
                    target: ps.entity_id,
                    type: 'enables'
                });
            }
        });

        // ========== L3: Tracks ==========
        (State.tracks || []).forEach(track => {
            const node = {
                id: track.entity_id,
                type: 'Track',
                name: track.entity_name || track.entity_id,
                data: track,
                ...this.nodeConfig.Track
            };
            this.nodes.push(node);
            nodeMap.set(track.entity_id, node);

            // Link Track to parent Condition
            if (track.parent_id && nodeMap.has(track.parent_id)) {
                this.links.push({
                    source: track.parent_id,
                    target: track.entity_id,
                    type: 'contains'
                });
            }

            // Track outgoing relations
            if (track.outgoing_relations) {
                track.outgoing_relations.forEach(rel => {
                    if (nodeMap.has(rel.target_id)) {
                        this.links.push({
                            source: track.entity_id,
                            target: rel.target_id,
                            type: rel.type || 'enables'
                        });
                    }
                });
            }
        });

        // ========== L4: Hypotheses (먼저 nodeMap에 추가) ==========
        (State.hypotheses || []).forEach(hyp => {
            const node = {
                id: hyp.entity_id,
                type: 'Hypothesis',
                name: hyp.entity_name || hyp.entity_id,
                data: hyp,
                ...this.nodeConfig.Hypothesis
            };
            this.nodes.push(node);
            nodeMap.set(hyp.entity_id, node);
        });

        // ========== L4: Projects ==========
        (State.projects || []).forEach(proj => {
            const node = {
                id: proj.entity_id,
                type: 'Project',
                name: proj.entity_name || proj.entity_id,
                data: proj,
                ...this.nodeConfig.Project
            };
            this.nodes.push(node);
            nodeMap.set(proj.entity_id, node);

            // Link to parent Track
            if (proj.parent_id && nodeMap.has(proj.parent_id)) {
                this.links.push({
                    source: proj.parent_id,
                    target: proj.entity_id,
                    type: 'part_of'
                });
            }

            // Link to track_id if different from parent (N:N)
            if (proj.track_id && proj.track_id !== proj.parent_id && nodeMap.has(proj.track_id)) {
                this.links.push({
                    source: proj.track_id,
                    target: proj.entity_id,
                    type: 'part_of'
                });
            }

            // Project validates Hypothesis (이제 Hypothesis가 nodeMap에 있음)
            if (proj.validates) {
                const validates = Array.isArray(proj.validates) ? proj.validates : [proj.validates];
                validates.forEach(hypId => {
                    if (nodeMap.has(hypId)) {
                        this.links.push({
                            source: proj.entity_id,
                            target: hypId,
                            type: 'validates'
                        });
                    }
                });
            }
        });

        // ========== Hypothesis → Track 링크 (parent_id) ==========
        (State.hypotheses || []).forEach(hyp => {
            if (hyp.parent_id && nodeMap.has(hyp.parent_id)) {
                this.links.push({
                    source: hyp.parent_id,
                    target: hyp.entity_id,
                    type: 'contains'
                });
            }
        });

        // Note: Task nodes are NOT added to the graph (shown in side panel only)
    },

    // ============================================
    // Render
    // ============================================
    render() {
        const container = document.getElementById('graphContainer');
        if (!container) return;

        // Prepare data from State
        this.prepareData();

        console.log('Total nodes:', this.nodes.length);
        console.log('Node types:', this.nodes.map(n => n.type));

        // Clear existing
        container.innerHTML = '';

        if (this.nodes.length === 0) {
            container.innerHTML = `
                <div class="graph-empty">
                    <div class="graph-empty-icon">📊</div>
                    <div class="graph-empty-text">No entities to display</div>
                    <div class="graph-empty-hint">Add Tracks, Projects, or Tasks to see the graph</div>
                </div>
            `;
            return;
        }

        const width = container.clientWidth;
        const height = container.clientHeight;

        // Create SVG
        this.svg = d3.select(container)
            .append('svg')
            .attr('class', 'graph-svg')
            .attr('width', width)
            .attr('height', height)
            .call(this.zoom);

        // Arrow marker definition
        this.svg.append('defs').append('marker')
            .attr('id', 'arrowhead')
            .attr('viewBox', '-0 -5 10 10')
            .attr('refX', 20)
            .attr('refY', 0)
            .attr('orient', 'auto')
            .attr('markerWidth', 6)
            .attr('markerHeight', 6)
            .append('path')
            .attr('d', 'M 0,-5 L 10,0 L 0,5')
            .attr('class', 'edge-arrow');

        // Main group for zoom/pan
        this.g = this.svg.append('g');

        // Draw layer lines and labels
        this.drawLayers(width, height);

        // Set initial positions based on layer
        this.setInitialPositions(width, height);

        // Create force simulation
        this.simulation = d3.forceSimulation(this.nodes)
            .force('link', d3.forceLink(this.links)
                .id(d => d.id)
                .distance(120)
                .strength(0.2))
            .force('charge', d3.forceManyBody()
                .strength(-150))
            .force('x', d3.forceX(width / 2).strength(0.03))
            .force('y', d3.forceY(d => this.getLayerY(d.layer, height)).strength(0.5))
            .force('collision', d3.forceCollide().radius(d => d.radius + 15))
            .alphaDecay(0.05)  // Slower decay for smoother settling
            .velocityDecay(0.4);  // Higher friction to reduce oscillation

        // Draw links
        const link = this.g.append('g')
            .attr('class', 'links')
            .selectAll('path')
            .data(this.links)
            .enter()
            .append('path')
            .attr('class', d => `graph-edge ${d.type}`)
            .attr('marker-end', 'url(#arrowhead)');

        // Track if dragging occurred
        let isDragging = false;

        // Draw nodes
        const node = this.g.append('g')
            .attr('class', 'nodes')
            .selectAll('g')
            .data(this.nodes)
            .enter()
            .append('g')
            .attr('class', 'graph-node')
            .call(d3.drag()
                .on('start', (event, d) => {
                    isDragging = false;
                    this.dragStarted(event, d);
                })
                .on('drag', (event, d) => {
                    isDragging = true;
                    this.dragged(event, d);
                })
                .on('end', (event, d) => {
                    this.dragEnded(event, d);
                    // Delay reset to allow click check
                    setTimeout(() => { isDragging = false; }, 100);
                }))
            .on('click', (event, d) => {
                console.log('Node clicked:', d.id, 'isDragging:', isDragging);
                event.stopPropagation();
                if (!isDragging) {
                    this.selectNode(d);
                }
            });

        // Node circles
        node.append('circle')
            .attr('class', d => `node-circle ${d.type.toLowerCase()}`)
            .attr('r', d => d.radius);

        // Node icons
        node.append('text')
            .attr('class', 'node-icon')
            .attr('dy', '0.1em')
            .text(d => d.icon);

        // Node labels
        node.append('text')
            .attr('class', 'node-label')
            .attr('dy', d => d.radius + 14)
            .text(d => this.truncateLabel(d.name, 15));

        // Update positions on tick
        this.simulation.on('tick', () => {
            link.attr('d', d => this.linkPath(d));

            node.attr('transform', d => {
                // Clamp X to container bounds
                d.x = Math.max(50, Math.min(width - 50, d.x));
                return `translate(${d.x},${d.y})`;
            });
        });

        // Add legend
        this.renderLegend(container);

        // Add controls
        this.renderControls(container);

        // Initial zoom to fit
        this.zoomToFit();
    },

    drawLayers(width, height) {
        const layers = [
            { y: this.layers.northstar, label: 'North Star (10Y Vision)' },
            { y: this.layers.metahypothesis, label: 'Meta Hypotheses (MH1-4)' },
            { y: this.layers.strategy, label: 'Conditions / Product Lines / Partnerships' },
            { y: this.layers.track, label: 'Tracks (12M)' },
            { y: this.layers.execution, label: 'Projects / Hypotheses' }
        ];

        layers.forEach(layer => {
            const y = height * layer.y;

            // Layer line
            this.g.append('line')
                .attr('class', 'layer-line')
                .attr('x1', 50)
                .attr('y1', y)
                .attr('x2', width - 50)
                .attr('y2', y);

            // Layer label
            this.g.append('text')
                .attr('class', 'layer-label')
                .attr('x', 20)
                .attr('y', y - 10)
                .text(layer.label);
        });
    },

    setInitialPositions(width, height) {
        // Group nodes by layer
        const layerNodes = {
            strategy: this.nodes.filter(n => n.layer === 'strategy'),
            execution: this.nodes.filter(n => n.layer === 'execution'),
            task: this.nodes.filter(n => n.layer === 'task')
        };

        // Distribute nodes horizontally within each layer
        Object.entries(layerNodes).forEach(([layer, nodes]) => {
            const y = this.getLayerY(layer, height);
            const spacing = width / (nodes.length + 1);

            nodes.forEach((node, i) => {
                node.x = spacing * (i + 1);
                node.y = y;
            });
        });
    },

    getLayerY(layer, height) {
        return height * (this.layers[layer] || 0.5);
    },

    linkPath(d) {
        const sourceX = d.source.x;
        const sourceY = d.source.y;
        const targetX = d.target.x;
        const targetY = d.target.y;

        // Calculate control points for curved path
        const dx = targetX - sourceX;
        const dy = targetY - sourceY;
        const dr = Math.sqrt(dx * dx + dy * dy) * 0.5;

        // Adjust for node radius
        const sourceRadius = d.source.radius || 20;
        const targetRadius = d.target.radius || 20;
        const angle = Math.atan2(dy, dx);
        const sX = sourceX + Math.cos(angle) * sourceRadius;
        const sY = sourceY + Math.sin(angle) * sourceRadius;
        const tX = targetX - Math.cos(angle) * (targetRadius + 10);
        const tY = targetY - Math.sin(angle) * (targetRadius + 10);

        return `M${sX},${sY}Q${(sX + tX) / 2},${(sY + tY) / 2 - 20} ${tX},${tY}`;
    },

    truncateLabel(text, maxLength) {
        if (!text) return '';
        // Remove common prefixes
        text = text.replace(/^(Track_|Project_|Task_|Condition_|Hypothesis_)/, '');
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength - 2) + '...';
    },

    // ============================================
    // Interaction
    // ============================================
    selectNode(node) {
        console.log('selectNode called:', node);

        // Deselect previous
        this.g.selectAll('.graph-node').classed('selected', false);

        // Select new
        this.selectedNode = node;
        this.g.selectAll('.graph-node')
            .filter(d => d.id === node.id)
            .classed('selected', true);

        // Show detail panel
        if (typeof GraphDetailPanel !== 'undefined') {
            GraphDetailPanel.show(node);
        } else {
            console.error('GraphDetailPanel is not defined');
        }
    },

    dragStarted(event, d) {
        // Only heat up simulation if actually dragging (not just clicking)
        d.fx = d.x;
        d.fy = d.y;
    },

    dragged(event, d) {
        // Restart simulation only when actually dragging
        if (!event.active) this.simulation.alphaTarget(0.1).restart();
        d.fx = event.x;
        d.fy = event.y;
    },

    dragEnded(event, d) {
        if (!event.active) this.simulation.alphaTarget(0);
        d.fx = null;
        d.fy = null;
    },

    // ============================================
    // Controls
    // ============================================
    renderLegend(container) {
        const legendHtml = `
            <div class="graph-legend">
                <div class="graph-legend-title">Legend</div>
                <div class="graph-legend-items">
                    <div class="graph-legend-item">
                        <div class="graph-legend-dot northstar"></div>
                        <span>North Star</span>
                    </div>
                    <div class="graph-legend-item">
                        <div class="graph-legend-dot metahypothesis"></div>
                        <span>Meta Hypothesis</span>
                    </div>
                    <div class="graph-legend-item">
                        <div class="graph-legend-dot condition"></div>
                        <span>Condition</span>
                    </div>
                    <div class="graph-legend-item">
                        <div class="graph-legend-dot productline"></div>
                        <span>Product Line</span>
                    </div>
                    <div class="graph-legend-item">
                        <div class="graph-legend-dot partnershipstage"></div>
                        <span>Partnership</span>
                    </div>
                    <div class="graph-legend-item">
                        <div class="graph-legend-dot track"></div>
                        <span>Track</span>
                    </div>
                    <div class="graph-legend-item">
                        <div class="graph-legend-dot project"></div>
                        <span>Project</span>
                    </div>
                    <div class="graph-legend-item">
                        <div class="graph-legend-dot hypothesis"></div>
                        <span>Hypothesis</span>
                    </div>
                </div>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', legendHtml);
    },

    renderControls(container) {
        const controlsHtml = `
            <div class="graph-controls">
                <button class="graph-control-btn" onclick="Graph.zoomIn()" title="Zoom In">+</button>
                <button class="graph-control-btn" onclick="Graph.zoomOut()" title="Zoom Out">−</button>
                <button class="graph-control-btn" onclick="Graph.zoomToFit()" title="Fit to View">⊡</button>
                <button class="graph-control-btn" onclick="Graph.resetSimulation()" title="Reset Layout">↻</button>
            </div>
        `;
        container.insertAdjacentHTML('beforeend', controlsHtml);
    },

    zoomIn() {
        this.svg.transition().duration(300).call(
            this.zoom.scaleBy, 1.3
        );
    },

    zoomOut() {
        this.svg.transition().duration(300).call(
            this.zoom.scaleBy, 0.7
        );
    },

    zoomToFit() {
        if (!this.svg || !this.nodes.length) return;

        const container = document.getElementById('graphContainer');
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Calculate bounds
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;

        this.nodes.forEach(node => {
            minX = Math.min(minX, node.x - node.radius);
            maxX = Math.max(maxX, node.x + node.radius);
            minY = Math.min(minY, node.y - node.radius);
            maxY = Math.max(maxY, node.y + node.radius);
        });

        const nodesWidth = maxX - minX;
        const nodesHeight = maxY - minY;
        const scale = Math.min(
            (width - 100) / nodesWidth,
            (height - 100) / nodesHeight,
            1.5
        );
        const translateX = (width - nodesWidth * scale) / 2 - minX * scale;
        const translateY = (height - nodesHeight * scale) / 2 - minY * scale;

        this.svg.transition().duration(500).call(
            this.zoom.transform,
            d3.zoomIdentity.translate(translateX, translateY).scale(scale)
        );
    },

    resetSimulation() {
        if (!this.simulation) return;

        const container = document.getElementById('graphContainer');
        const width = container.clientWidth;
        const height = container.clientHeight;

        // Reset positions
        this.setInitialPositions(width, height);

        // Restart simulation
        this.simulation.alpha(1).restart();

        // Reset zoom
        this.svg.transition().duration(300).call(
            this.zoom.transform,
            d3.zoomIdentity
        );
    },

    // ============================================
    // Visibility
    // ============================================
    show() {
        const graphView = document.getElementById('graphView');
        const kanbanView = document.getElementById('kanbanView');

        if (graphView) graphView.classList.add('active');
        if (kanbanView) kanbanView.classList.remove('active');

        // Render after showing (needs dimensions)
        setTimeout(() => this.render(), 50);
    },

    hide() {
        const graphView = document.getElementById('graphView');
        const kanbanView = document.getElementById('kanbanView');

        if (graphView) graphView.classList.remove('active');
        if (kanbanView) kanbanView.classList.add('active');

        // Close detail panel
        GraphDetailPanel.hide();
    }
};

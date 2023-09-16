/*
*    main.js
*    Mastering Data Visualization with D3.js
*    Project 3 - CoinStats
*/

const MARGIN = { LEFT: 90, RIGHT: 100, TOP: 50, BOTTOM: 100 }
const WIDTH = 860 - MARGIN.LEFT - MARGIN.RIGHT
const HEIGHT = 500 - MARGIN.TOP - MARGIN.BOTTOM
const svg = d3.select("#chart-area").append("svg")
	.attr("width", WIDTH + MARGIN.LEFT + MARGIN.RIGHT)
	.attr("height", HEIGHT + MARGIN.TOP + MARGIN.BOTTOM)

const g = svg.append("g")
	.attr("transform", `translate(${MARGIN.LEFT}, ${MARGIN.TOP})`)

// time parser for x-scale
const parseTime = d3.timeParse('%d/%m/%Y')
// for tooltip
const bisectDate = d3.bisector(d => d.year).left

// scales
const x = d3.scaleTime().range([0, WIDTH])
const y = d3.scaleLinear().range([HEIGHT, 0])

// xAxisGroup
const xAxisGroup = g.append("path")
	.attr("class", "line")
	.attr("fill", "none")
	.attr("stroke", "grey")
	.attr("stroke-width", "3px")

// axis generators
const xAxisCall = d3.axisBottom()
const valueFormatter = d3.format(".2s")
const yAxisCall = d3.axisLeft()
	.ticks(6)
	.tickFormat(d => valueFormatter(d).replace(/G/, "B"))

// axis groups
const xAxis = g.append("g")
	.attr("class", "x axis")
	.attr("transform", `translate(0, ${HEIGHT})`)
const yAxis = g.append("g")
	.attr("class", "y axis")

let coinSelect = $('#coin-select')
let varSelect = $('#var-select')
let selectedCoin = coinSelect.find(":selected").val();
let selectedVar = varSelect.find(":selected").val();

let selectedVarToYTitle = (selectedVar) => {
	switch (selectedVar) {
		case "price_usd":
			return "Price ($)"
		case "market_cap":
			return "Market Capitalization ($)"
		case "24h_vol":
			return "24 Hour Trading Volume ($)"
	}
}

// y-axis label
yAxisLabel = yAxis.append("text")
	.attr("class", "y-axis-title")
	.attr("y", 6)
	.attr("dy", "-4em")
	.attr("dx", "-4.5em")
	.attr("transform", "rotate(-90)")
	.style("text-anchor", "end")
	.attr("fill", "#5D6971")

// x-axis label
xAxis.append("text")
	.attr("class", "x-axis-title")
	.attr("transform", `translate(${WIDTH / 2}, 0)`)
	.style("text-anchor", "start")
	.attr("dy", "4em")
	.attr("fill", "#5D6971")
	.text("Time")

// line path generator
const line = d3.line()
	.x(d => x(d.year))
	.y(d => y(d.value))

d3.json("data/coins.json").then(data => {
	// clean data
	coinSelect.on('change', function () {
		selectedCoin = this.value
		update(data)
	})

	varSelect.on('change', function () {
		selectedVar = this.value
		update(data)
	})

	/******************************** Tooltip Code ********************************/

	const focus = g.append("g")
		.attr("class", "focus")
		.style("display", "none")

	focus.append("line")
		.attr("class", "x-hover-line hover-line")
		.attr("y1", 0)
		.attr("y2", HEIGHT)

	focus.append("line")
		.attr("class", "y-hover-line hover-line")
		.attr("x1", 0)
		.attr("x2", WIDTH)

	focus.append("circle")
		.attr("r", 7.5)

	focus.append("text")
		.attr("x", 15)
		.attr("dy", ".31em")

	g.append("rect")
		.attr("class", "overlay")
		.attr("width", WIDTH)
		.attr("height", HEIGHT)
		.on("mouseover", () => focus.style("display", null))
		.on("mouseout", () => focus.style("display", "none"))
		.on("mousemove", mousemove)

	function mousemove() {
		const x0 = x.invert(d3.mouse(this)[0])
		const i = bisectDate(data[selectedCoin], x0, 1)
		const d0 = data[selectedCoin][i - 1]
		const d1 = data[selectedCoin][i]
		const d = x0 - d0.year > d1.year - x0 ? d1 : d0
		focus.attr("transform", `translate(${x(d.year)}, ${y(d.value)})`)
		focus.select("text").text(valueFormatter(d.value).replace(/G/, "B"))
		focus.select(".x-hover-line").attr("y2", HEIGHT - y(d.value))
		focus.select(".y-hover-line").attr("x2", -x(d.year))
	}
	update(data)

	/******************************** Tooltip Code ********************************/
})

const update = (data) => {
	const transition = d3.transition()
		.duration(1000)
	// set scale domains
	data[selectedCoin].map(d => {
		d.year = parseTime(d.date)
		d.value = Number(d[selectedVar])
	})
	x.domain(d3.extent(data[selectedCoin], d => d.year))
	y.domain([
		d3.min(data[selectedCoin], d => d.value) / 1.005,
		d3.max(data[selectedCoin], d => d.value) * 1.005
	])

	// xAxisGroup.attr("d", line(data[selectedCoin]))

	// generate axes once scales have been set
	xAxis.transition(transition).call(xAxisCall.scale(x))
	yAxis.transition(transition).call(yAxisCall.scale(y))

	yAxisLabel.text(selectedVarToYTitle(selectedVar))

	g.selectAll(".line")
		.transition(transition)
		.attr("d", line(data[selectedCoin]))
}

import raw from './ressources/data.json' assert { type: 'json' };
import dz from './ressources/algeria@7.json' assert { type: 'json' };

const data = raw['data'];
// Variables à utiliser pour la visualisation
const variables = ['sexe', 'wilaya', 'age', 'niveau_etude', 'maladie', 'fumer', 'alcool'];
const maladieVars = ['Diabète', 'hypertension artérielle', 'plus de 2', 'Asthme', 'Maladie caridiaque']

console.log(data)
const width = 1000;
const height = 600;
const margin = 40;

const radius = Math.min(width, height) / 2 - margin;

const tooltip = d3.select('body').append('div').attr('class', 'tooltip');

const maladies = [
	...new Set(
		data
			.sort((a, b) => {
				if (a.age == b.age) return 0;
				return a.age < b.age ? -1 : 1;
			})
			.map((d) => d.maladie)
	),
].filter((d) => d);


// Création du diagramme à barres
const renderBarChart = () => {
	// Define age intervals
	const maxAge = Math.max(...data.map((d) => d.age));
	const minAge = Math.min(...data.map((d) => d.age));
	const ageIntervals = Array.from(
		{ length: Math.ceil((maxAge - minAge) / 10) + 1 },
		(_, i) => minAge - (minAge % 10) + (i + 1) * 10
	);

	// Categorize individuals into age groups
	const ageGroups = d3.rollup(
		// Remove individuals with no disease
		data.filter((d) => d.maladie),
		(v) => v.length,
		(d) => {
			const ageInterval = ageIntervals.find((interval) => d.age <= interval);
			return ageInterval
				? ageInterval == ageIntervals[0]
					? `${ageInterval} and less`
					: `${ageInterval - 9}-${ageInterval}`
				: `${ageIntervals[ageIntervals.length - 1]}+`;
		},
		(d) => d.maladie
	);

	// Organize data for d3 stack
	const ageGroupsMap = [...ageGroups.keys()].map((k) => {
		const diseasesMap = new Map(ageGroups.get(k));
		diseasesMap.set('age', k);
		return Object.fromEntries(diseasesMap.entries());
	});

	const ages = [...ageGroups.keys()];
	const maxPersonsPerGroup = Math.max(
		...[...ageGroups.values()].map((d) =>
			[...d.values()].reduce((a, b) => a + b)
		)
	);

	var margin = { top: 10, right: 30, bottom: 20, left: 50 },
		width = 460 - margin.left - margin.right,
		height = 400 - margin.top - margin.bottom;

	const svg = d3
		.select('#bar-chart')
		.append('svg')
		.attr('width', width + margin.left + margin.right)
		.attr('height', height + margin.top + margin.bottom)
		.append('g')
		.attr('transform', 'translate(' + margin.left + ',' + margin.top + ')');

	// Définir les échelles pour les axes X et Y
	// Add X axis
	const x = d3.scaleBand().domain(ages).range([0, width]).padding([0.2]);
	svg
		.append('g')
		.attr('transform', `translate(0, ${height})`)
		.call(d3.axisBottom(x).tickSizeOuter(0));

	// Add Y axis
	const y = d3.scaleLinear().domain([0, maxPersonsPerGroup]).range([height, 0]);
	svg.append('g').call(d3.axisLeft(y));

	const color = d3.scaleOrdinal().domain(maladieVars).range(['#ff6666', '#6699cc', '#808080', '#66cc66', '#9966cc']);

	const stackedData = d3.stack().keys(maladies)(ageGroupsMap);

	svg
		.append('g')
		.selectAll('g')
		// Enter in the stack data = loop key per key = group per group
		.data(stackedData)
		.join('g')
		.attr('fill', (d) => color(d.key))
		.attr('class', (d) => 'myRect ' + d.key.replaceAll(' ', '-')) // Add a class to each subgroup: their name
		.selectAll('rect')
		// enter a second time = loop subgroup per subgroup to add all rectangles
		.data((d) => d)
		.join('rect')
		.attr('x', (d) => x(d.data.age))
		.attr('y', (d) => y(d[1]))
		.attr('height', (d) => {
			const h = y(d[0]) - y(d[1]);
			return isNaN(h) ? 0 : h;
		})
		.attr('width', x.bandwidth())
		.attr('stroke', 'grey')
		.on('mouseover', handleMouseOver)
		.on('mouseleave', handleMouseLeave)
		.on('mousemove', handleMouseMove);

	function handleMouseOver(event, d) {
		const maladie = d3.select(this.parentNode).datum().key;
		d3.selectAll('.myRect').style('opacity', 0.2);
		d3.selectAll('.' + maladie.replaceAll(' ', '-')).style('opacity', 1);

		var maladieValue = d.data[maladie];

		tooltip
			.style('display', 'block')
			.html(`<p>${maladie}: ${maladieValue}</p>`);
	}

	function handleMouseLeave() {
		d3.selectAll('.myRect').style('opacity', 1);

		tooltip.style('display', 'none');
	}

	function handleMouseMove(event) {
		tooltip
			.style('left', `${event.pageX + 10}px`)
			.style('top', `${event.pageY + 10}px`);
	}
};



// Fonction pour préparer les données à visualiser
const prepareData = () => {
	const preparedData = {};

	variables.forEach((variable) => {
		preparedData[variable] = d3.rollup(
			data,
			(v) => v.length,
			(d) => d[variable]
		);
	});

	return preparedData;
};

const preparedData = prepareData();
let total = 0;
const prepareChartData = (variable) => {
	total = 0;
	const preparedChartData = new Map();

	for (let [key, value] of preparedData[variable].entries()) {
		if (key) {
			preparedChartData.set(key, value);
			total += value;
		}
	}

	return preparedChartData;
}

const outerArc = d3.arc()
					.innerRadius(radius * 0.9)
					.outerRadius(radius * 0.9);

const arc = d3.arc()
			.outerRadius(radius * 0.8)
			.innerRadius(radius * 0.4);

const key = function(d){ return d.data[0]; };

function dessinerPieChart(variable) {
	// set the color scale

	let dataWithMaladie;

	let sexeMaladiesMap;
	d3.select('#hello').remove()

	const svgPiechart = d3.select('#pichart')
						.append("svg")
						.attr("id", "hello")
						.attr("width", width)
						.attr("height", height);
	let color;
	if (variable == 'maladie') {
		dataWithMaladie = data.filter((d) => d.maladie);
		sexeMaladiesMap = d3.rollup(
			dataWithMaladie,
			(v) => v.length,
			(d) => d.maladie,
			(d) => d.sexe
		);
		color = d3.scaleOrdinal()
		.domain([...maladieVars, 'oui', 'Non'])
		.range(['#ff6666', '#6699cc', '#808080', '#66cc66', '#9966cc']);		// Définir de bonnes couleurs !!!
	} else {
		color = d3.scaleOrdinal()
		.domain(['oui', 'Non'])
		.range(d3.schemeCategory10.slice(0, 2));
		if (variable == 'fumer') {
			dataWithMaladie = data.filter((d) => d.fumer);
			sexeMaladiesMap = d3.rollup(
				dataWithMaladie,
				(v) => v.length,
				(d) => d.fumer,
				(d) => d.sexe
			);
		} else {
			dataWithMaladie = data.filter((d) => d.alcool);
			sexeMaladiesMap = d3.rollup(
				dataWithMaladie,
				(v) => v.length,
				(d) => d.alcool,
				(d) => d.sexe
			);
		}
	}

	const dataPie = prepareChartData(variable);
	const groupe = svgPiechart.append("g")
				.attr("transform", `translate(${width/2}, ${height/2})`);
	// // Compute the position of each group on the pie:
	const pie = d3.pie()
	.value(function(d) {return d[1]; })
	.sort(function(a, b) { return d3.ascending(a.key, b.key);} ) // This make sure that group order remains the same in the pie chart
	const data_ready = pie(dataPie.entries())
	const pieData = data_ready;


	groupe.append("g")
		.attr("class", "slices");
	groupe.append("g")
		.attr("class", "labels");
	groupe.append("g")
		.attr("class", "lines");

	

	// console.log(data_ready);

	// // map to data
	// const u = groupe.selectAll("path")
	// 				.data(data_ready)

	// // Build the pie chart: Basically, each part of the pie is a path that we build using the arc function.
	// u
	// .join('path')
	// .transition()
	// .duration(1000)
	// .attr('d', d3.arc()
	// 	.innerRadius(0)
	// 	.outerRadius(radius)
	// )
	// .attr('fill', function(d){ return(color(d.data[0])) })
	// .attr("stroke", "white")
	// .style("stroke-width", "2px")
	// .style("opacity", 1)

	
	/* ------- PIE SLICES -------*/

	const slice = groupe
	.select(".slices")
	.selectAll("path.slice")
	.data(pieData, key)


	slice
	.enter()
	.insert("path")
	.style("fill", function(d) {
		return color(d.data[0]);
	})
	.attr("class", (d) => {
		return "slice " +  d.data[0].replaceAll(' ', '_');
	})
	.on('mouseover', handleMouseOver)
	.on('mouseleave', handleMouseLeave)
	.on('mousemove', handleMouseMove)
	.merge(slice)
	.transition()
	.duration(1000)
	.attrTween("d", function(d) {
		this._current = this._current || d;
		const interpolate = d3.interpolate(this._current, d);
		this._current = interpolate(0);
		return function(t) {
		return arc(interpolate(t));
		};
	});

	slice.exit().remove();



	// Add title
	groupe.append("text")
		.text(variable.toUpperCase())
		.attr("text-anchor", "middle")
		.attr("dy", "-0.5em")
		.attr("fill", "black");
	
	/* ------- TEXT LABELS -------*/

	const text = groupe
	.select(".labels")
	.selectAll("text")
	.data(data_ready, key);

	function midAngle(d) {
	return d.startAngle + (d.endAngle - d.startAngle) / 2;
	}

	text
	.enter()
	.append("text")
	.attr("dy", ".35em")
	.text(function(d) {
		return `${d.data[0]} - ${parseInt((d.data[1] / total) * 100)}%`;
	})
	.merge(text)
	.transition()
	.duration(1000)
	.attrTween("transform", function(d) {
		this._current = this._current || d;
		const interpolate = d3.interpolate(this._current, d);
		this._current = interpolate(0);
		return function(t) {
		const d2 = interpolate(t);
		const pos = outerArc.centroid(d2);
		pos[0] = radius * (midAngle(d2) < Math.PI ? 1 : -1);
		return "translate(" + pos + ")";
		};
	})
	.styleTween("text-anchor", function(d) {
		this._current = this._current || d;
		const interpolate = d3.interpolate(this._current, d);
		this._current = interpolate(0);
		return function(t) {
		const d2 = interpolate(t);
		return midAngle(d2) < Math.PI ? "start" : "end";
		};
	});

	text.exit().remove();

	/* ------- SLICE TO TEXT POLYLINES -------*/

	const polyline = groupe
	.select(".lines")
	.selectAll("polyline")
	.data(data_ready, key);

	polyline
	.join("polyline")
	.transition()
	.duration(1000)
	.attrTween("points", function(d) {
		this._current = this._current || d;
		const interpolate = d3.interpolate(this._current, d);
		this._current = interpolate(0);
		return function(t) {
		const d2 = interpolate(t);
		const pos = outerArc.centroid(d2);
		pos[0] = radius * 0.95 * (midAngle(d2) < Math.PI ? 1 : -1);
		return [arc.centroid(d2), outerArc.centroid(d2), pos];
		};
	});

	polyline.exit().remove();

	function handleMouseOver(event, d) {
		const maladie = d.data[0];
		d3.selectAll('.slice').style('opacity', 0.2);
		d3.selectAll('.' + maladie.replaceAll(' ', '_'))
			.style('opacity', 1)

		tooltip.style('display', 'block')
			.html(`<ol>${
			sexeMaladiesMap.get(maladie)
				? [...sexeMaladiesMap.get(maladie).entries()]
						.sort((a, b) => b[1] - a[1])
						.map((d) => `<li>${d[0]}: ${d[1]}</li>`)
						.join('')
				: ''
		}</ol>
		`);
	}

	function handleMouseLeave() {
		d3.selectAll('.slice')
			.style('opacity', 1)

		tooltip.style('display', 'none');
	}

	function handleMouseMove(event) {
		tooltip
			.style('left', `${event.pageX + 10}px`)
			.style('top', `${event.pageY + 10}px`);
	}
}		 





// =====================================================


const renderMapChart = () => {
	const dataWithMaladie = data.filter((d) => d.maladie);
	const wilayasMap = d3.rollup(
		dataWithMaladie,
		(v) => v.length,
		(d) => d.wilaya
	);
	const wilayasMaladiesMap = d3.rollup(
		dataWithMaladie,
		(v) => v.length,
		(d) => d.wilaya,
		(d) => d.maladie
	);

	const colorScale = d3
		.scaleThreshold()
		.domain([0, ...new Set([...wilayasMap.values()].sort((a, b) => a - b))])
		.range(d3.schemeReds[9]);

	const width = 460;
	const height = 400;

	const svg = d3
		.select('#map-chart')
		.append('svg')
		.attr('width', 800)
		.attr('height', 600)
		.attr('viewBox', `${-width / 2} ${-height / 2} ${width * 2} ${height * 2}`)
		.attr('transform', `scale(-1, 1) rotate(180)`);

	const g = svg.append('g');

	const path = d3.geoPath();

	g.append('g')
		.attr('cursor', 'pointer')
		.selectAll('path')
		.data(topojson.feature(dz, dz.objects.DZA_adm1).features)
		.join('path')
		.attr('stroke', '#999')
		.attr('stroke-width', 0.4)
		.attr('d', path)
		.attr('fill', (d) => {
			const wilaya = d.properties.NAME_1;
			const maladie = wilayasMap.get(wilaya);
			return colorScale(maladie) || '#f4f4f4';
		})
		.attr('class', (d) => 'wilaya ' + d.properties.NAME_1.replaceAll(' ', '-').replaceAll("'", ''))
		.on('mouseover', handleMouseOver)
		.on('mouseleave', handleMouseLeave)
		.on('mousemove', handleMouseMove);
		// .append('title')
		// .text((d) => d.properties.NAME_1);

	g.append('path')
		.attr('fill', 'none')
		.attr('stroke-linejoin', 'round')
		.attr('d', path(topojson.mesh(dz, dz.objects.DZA_adm1, (a, b) => a !== b)));

	function handleMouseOver(event, d) {
		const wilaya = d.properties.NAME_1;
		d3.selectAll('.wilaya').style('opacity', 0.2);
		d3.selectAll('.' + wilaya.replaceAll(' ', '-').replaceAll("'", ''))
			.style('opacity', 1)
			.style('stroke', 'black');
		const wilayaCount = wilayasMap.get(wilaya) || 0;

		tooltip.style('display', 'block')
			.html(`<h3>${wilaya}</h3><ol>${
			wilayasMaladiesMap.get(wilaya)
				? [...wilayasMaladiesMap.get(wilaya).entries()]
						.sort((a, b) => b[1] - a[1])
						.map((d) => `<li>${d[0]}: ${d[1]}</li>`)
						.join('')
				: ''
		}</ol>
		`);
	}

	function handleMouseLeave() {
		d3.selectAll('.wilaya')
			.style('opacity', 1)
			.style('stroke', d3.select(this).attr('stroke'));

		tooltip.style('display', 'none');
	}

	function handleMouseMove(event) {
		tooltip
			.style('left', `${event.pageX + 10}px`)
			.style('top', `${event.pageY + 10}px`);
	}
};

// Appel de la fonction pour créer le diagramme à barres
renderBarChart();

// Appel de la fonction pour créer pie chart
dessinerPieChart('maladie');
const button1 = document.getElementById('button1');
button1.addEventListener('click', () => {
	dessinerPieChart("maladie");
});
const button2 = document.getElementById('button2');
button2.addEventListener('click', () => {
	dessinerPieChart("fumer");
});
const button3 = document.getElementById('button3');
button3.addEventListener('click', () => {
	dessinerPieChart("alcool");
});

// Appel de la fonction pour créer le map chart
renderMapChart();
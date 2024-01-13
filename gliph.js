// Données fictives pour simuler la base de données
import raw from './ressources/data.json' assert { type: 'json' };

const data = raw['data'];

// Variables à utiliser pour la visualisation
const variables = ['sexe', 'wilaya', 'age', 'niveau_etude'];

// Création du diagramme à barres
const renderBarChart = () => {
	// Define age intervals
	const maxAge = Math.max(...data.map((d) => d.age));
	const minAge = Math.min(...data.map((d) => d.age));
	const ageIntervals = Array.from(
		{ length: Math.ceil((maxAge - minAge) / 10) + 1 },
		(_, i) => minAge - (minAge % 10) + (i + 1) * 10
	);

	data.sort((a, b) => {
		if (a.age == b.age) return 0;
		return a.age < b.age ? -1 : 1;
	});

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
	const maladies = [...new Set(data.map((d) => d.maladie))].filter((d) => d);
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
	const y = d3
		.scaleLinear()
		.domain([0, maxPersonsPerGroup])
		.range([height, 0]);
	svg.append('g').call(d3.axisLeft(y));

	const color = d3.scaleOrdinal().domain(maladies).range(d3.schemeSet2);

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
		.on('mouseleave', handleMouseOut)
		.on('mousemove', handleMouseMove);

	// Tooltip for hover interactions
	const tooltip = d3
		.select('#bar-chart')
		.append('div')
		.attr('class', 'tooltip');

	function handleMouseOver(event, d) {
		const maladie = d3.select(this.parentNode).datum().key;
		d3.selectAll('.myRect').style('opacity', 0.2);
		d3.selectAll('.' + maladie.replaceAll(' ', '-')).style('opacity', 1);

		var maladieValue = d.data[maladie];

		tooltip
			.style('display', 'block')
			.html(`<p>${maladie}: ${maladieValue}</p>`);
	}

	function handleMouseOut() {
		d3.selectAll('.myRect').style('opacity', 1);

		tooltip.style('display', 'none');
	}

	function handleMouseMove(event) {
		tooltip
			.style('left', `${event.pageX + 10}px`)
			.style('top', `${event.pageY + 10}px`);
	}
};

renderBarChart();

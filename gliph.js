// Données fictives pour simuler la base de données
import raw from './ressources/data.json' assert { type: 'json' };
import dz from './ressources/algeria@7.json' assert { type: 'json' };

const data = raw.data;
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

// const wilayas = dz.objects.DZA_adm1.geometries.map((d) => d.properties.NAME_1);

// Variables à utiliser pour la visualisation
const variables = ['sexe', 'wilaya', 'age', 'niveau_etude'];

// Tooltip for hover interactions
const tooltip = d3.select('body').append('div').attr('class', 'tooltip');

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

renderBarChart();
renderMapChart();

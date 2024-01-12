// Données fictives pour simuler la base de données
import raw from './ressources/data.json' assert { type: 'json' };

const data = raw['data'];

console.log(data);

// Variables à utiliser pour la visualisation
const variables = ['sexe', 'wilaya', 'age', 'niveau_etude'];

// Création de la visualisation avec un diagramme à barres
const svg = d3.select('#visualization');

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

// Création du diagramme à barres
const renderBarChart = () => {
	const axeHeight = 550;
	const barsWidth = 450;

	const preparedData = prepareData();
	const chosenVar = preparedData[variables[3]];

	// Définir les échelles pour les axes X et Y
	const xScale = d3
		.scaleBand()
		.domain([...chosenVar.keys()])
		.range([50, barsWidth])
		.padding(0.5);

	const yScale = d3
		.scaleLinear()
		.domain([0, d3.max([...chosenVar.values()])])
		.range([axeHeight, 50]);

	// Ajouter les barres au diagramme
	svg
		.selectAll('rect')
		.data([...chosenVar.entries()])
		.enter()
		.append('rect')
		.attr('x', (d) => xScale(d[0]))
		.attr('y', (d) => yScale(d[1]))
		.attr('width', xScale.bandwidth())
		.attr('height', (d) => axeHeight - yScale(d[1]))
		.attr('fill', 'steelblue')
		.on('mouseover', handleMouseOver)
		.on('mouseout', handleMouseOut)
		.on('mousemove', handleMouseMove);

	// Ajouter les labels des barres
	svg
		.selectAll('text')
		.data([...chosenVar.entries()])
		.enter()
		.append('text')
		.attr('x', (d) => xScale(d[0]) + xScale.bandwidth() / 2)
		.attr('y', (d) => yScale(d[1]) - 5)
		.attr('text-anchor', 'middle')
		.text((d) => d[1])
		.attr('font-family', 'sans-serif')
		.attr('font-size', '12px')
		.attr('fill', 'black');

	// Tooltip for hover interactions
	const tooltip = d3.select('body').append('div').attr('class', 'tooltip');

	function handleMouseOver(event, d) {
		d3.select(this).attr('fill', 'orange');

		tooltip
			.style('display', 'block')
			.html(`<p>${d[0]}: ${d[1]}</p>`)
			.style('left', `${event.pageX}px`)
			.style('top', `${event.pageY}px`);
	}

	function handleMouseOut() {
		d3.select(this).attr('fill', 'steelblue');

		tooltip.style('display', 'none');
	}

	function handleMouseMove(event) {
		tooltip.style('left', `${event.pageX + 10}px`).style('top', `${event.pageY + 10}px`);
	}

	// Ajouter l'axe X
	svg
		.append('g')
		.attr('transform', `translate(0,${axeHeight})`)
		.call(d3.axisBottom(xScale));

	// Ajouter l'axe Y
	svg
		.append('g')
		.attr('transform', 'translate(50,0)')
		.call(d3.axisLeft(yScale));
};

// Appel de la fonction pour créer le diagramme à barres
renderBarChart();

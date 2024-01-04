// Données fictives pour simuler la base de données
const data = [
    { sexe: "Homme", wilaya: "Alger", age: 35, niveauEtude: "Master", activite: "Employé", fumeur: "Oui", fumeurQuotidien: "Oui", debutFume: 18, raisonFume: "Pression sociale", alcool: "Oui", freqAlcool: "2-3 fois par semaine", freqFruits: 4, freqLegumes: 5, matiereGrasse: "Huile d'olive", freqActivitePhysique: 3, salleSport: "Non", activiteTravail: "Oui", trajet10min: "Oui", trajet30min: 2, pratiqueSport: "Oui", tempsAssis: "6-8 heures", autresMaladies: "Oui", typeMaladies: "Diabète, Hypertension" },
    { sexe: "Femme", wilaya: "Alger", age: 35, niveauEtude: "Master", activite: "Employé", fumeur: "Oui", fumeurQuotidien: "Oui", debutFume: 18, raisonFume: "Pression sociale", alcool: "Oui", freqAlcool: "2-3 fois par semaine", freqFruits: 4, freqLegumes: 5, matiereGrasse: "Huile d'olive", freqActivitePhysique: 3, salleSport: "Non", activiteTravail: "Oui", trajet10min: "Oui", trajet30min: 2, pratiqueSport: "Oui", tempsAssis: "6-8 heures", autresMaladies: "Oui", typeMaladies: "Diabète, Hypertension" },

    // Ajoutez d'autres données fictives ici
];

// Variables à utiliser pour la visualisation
const variables = ["sexe", "wilaya", "age", "niveauEtude"];

// Création de la visualisation avec un diagramme à barres
const svg = d3.select("#visualization");

// Fonction pour préparer les données à visualiser
const prepareData = () => {
    const preparedData = {};

    variables.forEach(variable => {
        preparedData[variable] = d3.rollup(data, v => v.length, d => d[variable]);
    });

    return preparedData;
};

// Création du diagramme à barres
const renderBarChart = () => {
    const preparedData = prepareData();

    // Définir les échelles pour les axes X et Y
    const xScale = d3.scaleBand()
        .domain([...preparedData[variables[0]].keys()])
        .range([50, 750])
        .padding(0.1);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max([...preparedData[variables[0]].values()])])
        .range([550, 50]);

    // Ajouter les barres au diagramme
    svg.selectAll("rect")
        .data([...preparedData[variables[0]].entries()])
        .enter()
        .append("rect")
        .attr("x", d => xScale(d[0]))
        .attr("y", d => yScale(d[1]))
        .attr("width", xScale.bandwidth())
        .attr("height", d => 550 - yScale(d[1]))
        .attr("fill", "steelblue");

    // Ajouter l'axe X
    svg.append("g")
        .attr("transform", "translate(0,550)")
        .call(d3.axisBottom(xScale));

    // Ajouter l'axe Y
    svg.append("g")
        .attr("transform", "translate(50,0)")
        .call(d3.axisLeft(yScale));
};

// Appel de la fonction pour créer le diagramme à barres
renderBarChart();

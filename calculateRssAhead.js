var moment = require('moment');

function getCalcRss (aPlanetRss) {
  calcCoal(aPlanetRss);
  calcCopper(aPlanetRss);
  calcOre(aPlanetRss);
  calcUranium(aPlanetRss);
  return aPlanetRss;
}
function calculateQuantity(quantity, depot, rate, lastUpdate) {
  var startTime = moment.unix(parseInt(lastUpdate));
  var endTime = moment.utc();
  var duration = moment.duration(endTime.diff(startTime));
  var diff = duration.asDays();

  return parseFloat(Math.max(
    Math.min(
      parseFloat(quantity) + parseFloat(rate) * diff, // accumulation
      parseFloat(depot) // below depot
    ),
    parseFloat(quantity) // or overflow above depot
  ).toFixed(1));
}

function calcCoal (hostRssItem) {
  let calcRss = 0;
  if (hostRssItem !== null) {
      calcRss = calculateQuantity( 
          hostRssItem.coal,
          hostRssItem.coaldepot,
          hostRssItem.coalrate,
          hostRssItem.lastUpdate
      );
  }
  hostRssItem.coal = calcRss;
}

function calcOre (hostRssItem) {
  let calcRss = 0;
  if (hostRssItem !== null) {
      calcRss = calculateQuantity( 
          hostRssItem.ore,
          hostRssItem.oredepot,
          hostRssItem.orerate,
          hostRssItem.lastUpdate
      );
  }
  hostRssItem.ore = calcRss;
}

function calcCopper (hostRssItem) {
  let calcRss = 0;
  if (hostRssItem !== null) {
      calcRss = calculateQuantity( 
          hostRssItem.copper,
          hostRssItem.copperdepot,
          hostRssItem.copperrate,
          hostRssItem.lastUpdate
      );
  }
  hostRssItem.copper = calcRss;
}

function calcUranium (hostRssItem) {
  let calcRss = 0;
  if (hostRssItem !== null) {
      calcRss = calculateQuantity( 
          hostRssItem.uranium,
          hostRssItem.uraniumdepot,
          hostRssItem.uraniumrate,
          hostRssItem.lastUpdate
      );
  }
  hostRssItem.uranium = calcRss;
}

exports.getCalcRss = getCalcRss;
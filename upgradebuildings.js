var dsteem = require('dsteem');
var myArgs = process.argv.slice(2);
var confile = (myArgs[0] !== undefined)? myArgs[0] : '/config.js';
var startdelay = (myArgs[1] !== undefined)? myArgs[1] : 0; // in miliseconds
var conf = require(confile);
var apiservice = conf.apihost;
var moment = require('moment');
var axios = require('axios'); // alternate to node-fetch
var rssCalculator = require('./calculateRssAhead'); // needed to self-calculate ahead.
var delayfactor = 0;
const timeout = ms => new Promise(res => setTimeout(res, ms));

var client = new dsteem.Client(conf.steemnode);
var getCallsCounter = 0;
var longestwait = 60; //in seconds.
var fixedelay = 8811.967; //in seconds.
var getcalldelay = 3000; // in miliseconds.

async function get(url, config = {}) {
    const response = await axios.get(`${url}`, config).catch(err => {clog(err.response)});

    if (response.error) {
      return Promise.reject(
        new Error(`Error GET ${url} : ${JSON.stringify(response)}`)
      );
    }
    ++getCallsCounter;
    return response.data;
}

async function sendCustomJSON (_toUpgradeItem, _delayMS, key, _userid) {

  let my_data = getUBJSON(_toUpgradeItem.ID, _toUpgradeItem.buildingName, _userid);
  // await timeout(_delayMS); // change to multiple 2.5 seconds delay execution reduce the hit to RPC server.
  clocktime(`Started ${_toUpgradeItem.name}`);
    await client.broadcast.json({
        required_auths: [],
        required_posting_auths: [_userid],
        id: conf.appid,
        json: my_data,
    }, key).then(
        result => { console.log(_toUpgradeItem.name, result) },
        error => { console.error(_toUpgradeItem.name, error) }
    );
    clocktime(`End ${_toUpgradeItem.name}`);
   
};

async function getPlanets (postKey, userid, buildingNames, excludePlanets) {
  let key = dsteem.PrivateKey.fromString(postKey);
  getCallsCounter=0;
  let loadplanets = apiservice + `/loadplanets?user=${userid}&to=1000&sort=date`;
  let myPlanets = await get(loadplanets).catch(err=> clog(err.response));
  if (typeof myPlanets !== 'undefined') {
    for (var buildingName of buildingNames) {
        for (var aplanet of myPlanets.planets) {
          if (!excludePlanets.includes(aplanet.name)){
            let result = await getBuildingInfo(buildingName, aplanet.id, aplanet.name);
            if (typeof result !== 'undefined') {
              clog(`[${aplanet.name}] building can upgrade ${buildingName} = ${result.qualify}`);
              if (result.qualify) {
                clog(`Broadcast upgrade ${buildingName} for planet ${aplanet.name}`);
                longestwait = longestwait < result.time2build ? result.time2build : longestwait;
                await sendCustomJSON(result, 0, key, userid);
              }
            } else {
              clog(`WARNING: Issue with NC API!`);
            }
          } else {
            clog(`Skipping planet - ${aplanet.name} : ${aplanet.id}`);
          }
      }
    }
  } else {
    clog('Sorry unable to get your planet list. Issue with NextColony Services.');
  }
  clog(`total GET calls ${getCallsCounter}, longest wait for next upgrade execution is : ${longestwait} sec`);
}


async function getBuildingInfo (_buildingName, planetId, planetNama) {
    
    let loadBuildings = apiservice + `/loadbuildings?id=${planetId}`;
    let planetRss = await loadRss(planetId).catch(err => {clog(err.response)});
	await timeout(getcalldelay);
    var planetBuildings = await get(loadBuildings).catch(err => {clog(err.response)});
	await timeout(getcalldelay);
    var aBuilding = planetBuildings.find(({name})=> name == _buildingName);

    if (typeof aBuilding !== 'undefined')
    return {ID : planetId, name:planetNama, buildingName: _buildingName, qualify: buildingPossible(aBuilding, planetRss, planetNama)};
};

async function loadRss (planetId) {
  let loadquantity = apiservice + `/loadqyt?id=${planetId}`;
  var myResult = await get(loadquantity);
  return rssCalculator.getCalcRss(myResult); // ability to calculate approx rss.
};

function clog (msg) { console.log(msg) };
function isArrayEmpty (anArray) {
  return !(typeof anArray != "undefined" && anArray != null && anArray.length != null && anArray.length > 0);
}

function clocktime (convince) {
  let unixTime = Math.round(+new Date() / 1000);
  console.log(`send 2 Steem node ${convince} at ${unixTime}`);
}

function isBusy(busy) {
  var busyUntil = moment(new Date(busy * 1000));
  var now = moment.utc();
  if (busyUntil === 0 || busy === null) {
    return false;
  } else {
    if (now.isAfter(busyUntil)) {
      return false;
    } else {
      return true;
    }
  }
}

function getUBJSON(planetId, buildingName, ub_userid) {
    var scJson = {};
    var scCommand = {};
    // Create Command
    scJson["username"] = ub_userid;
    scJson["type"] = "upgrade";
    scCommand["tr_var1"] = planetId;
    scCommand["tr_var2"] = buildingName;

    scJson["command"] = scCommand;
    return JSON.stringify(scJson);
}

function buildingPossible(building, myRss, planetName) {
    if (isBusy(building.busy)) {
        clog(`[${planetName}] busy now lah`);
        return false;
      }
      if (myRss.coal < building.coal) {
        clog(`[${planetName}] coal !enough`);
        return false;
      }
      if (myRss.ore < building.ore) {
        clog(`[${planetName}] ore !enough`);
        return false;
      }
      if (myRss.copper < building.copper) {
        clog(`[${planetName}] copper !enough`);
        return false;
      }
      if (myRss.uranium < building.uranium) {
        clog(`[${planetName}] uranium !enough`);
        return false;
      }
      if (building.skill <= building.current) {
        clog(`[${planetName}] skill !enough`);
        return false;
      }
      return true;
}

// need to put it back to sleep base on the time 
async function runAll () {
  console.time('upgradeAllCred');
	clog(`Fixed Delay in Seconds : [${fixedelay}]`);
  for (var aConfig of conf.profile.credentials) {
    if (aConfig.postingkey !== undefined && aConfig.postingkey.length > 0) {
        await getPlanets(aConfig.postingkey, aConfig.userid, aConfig.includebuild, aConfig.exclude);
    } else {
        clog('No posting key in config');
    }
  }
  console.timeEnd('upgradeAllCred');
  longestwait = (longestwait <= 60) ? 5400 : longestwait; //put it to wait 1.5 hours = 5400 
  setTimeout(runAll, (fixedelay) * 1000) // convert to miliseconds;
}

//Test unit only
setTimeout(runAll, startdelay * 1000);
// qualifyShipyard('corvette','P-ZFCEHUZ1Z9S', 'entahlah');
// loadRss('P-ZFCEHUZ1Z9S');
// clog(JSON.stringify(rssRes));

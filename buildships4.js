var dsteem = require('dsteem');
var myArgs = process.argv.slice(2);
var shiptypeGlobal = (myArgs[0] !== undefined)? myArgs[0] : '';
var confile = (myArgs[1] !== undefined)? myArgs[1] : '/config.js';
var startdelay = (myArgs[2] !== undefined)? myArgs[2] : 0; // delay in miliseconds
var conf = require(confile);
var apiservice = conf.apihost;
var moment = require('moment');
var axios = require('axios'); // alternate to node-fetch
var delayfactor = 0;
const timeout = ms => new Promise(res => setTimeout(res, ms));

var client = new dsteem.Client(conf.steemnode);
var getCallsCounter = 0;
var longestwait = 60; //in seconds.
var fixedelay = 8811.967; //in seconds.
var getcalldelay = 3000; //in miliseconds.

async function get(url, config = {}) {
    const response = await axios.get(`${url}`, config);

    if (response.error) {
      return Promise.reject(
        new Error(`Error GET ${url} : ${JSON.stringify(response)}`)
      );
    }
    ++getCallsCounter;
    return response.data;
}

async function sendCustomJSON (_toBuildItem, _delayMS, key, _userid) {

  let my_data = getBSJSON(_toBuildItem.ID, _toBuildItem.ship);
  // await timeout(_delayMS); // change to multiple 2.5 seconds delay execution reduce the hit to RPC server.
  clocktime(`Started ${_toBuildItem.name}`);
    await client.broadcast.json({
        required_auths: [],
        required_posting_auths: [_userid],
        id: conf.appid,
        json: my_data,
    }, key).then(
        result => { console.log(_toBuildItem.name, result) },
        error => { console.error(_toBuildItem.name, error) }
    );
    clocktime(`End ${_toBuildItem.name}`);
   
};

async function getPlanets (postKey, userid, shiptype, excludePlanets) {
  let key = dsteem.PrivateKey.fromString(postKey);
  console.time('build-1-Ship');
  let loadplanets = apiservice + `/loadplanets?user=${userid}&to=1000&sort=date`;
  let myPlanets = await get(loadplanets).catch(err=> clog(err.response.statusText));
  if (typeof myPlanets !== 'undefined') {
    for (var aplanet of myPlanets.planets) {
        if (!excludePlanets.includes(aplanet.name)){
          let result = await getShipyard(shiptype, aplanet.id, aplanet.name, userid);
          if (typeof result !== 'undefined') {
            clog(`[${aplanet.name}] shipyard can build ${shiptype} = ${result.qualify}`);
            if (result.qualify) {
              clog(`Broadcast build ${shiptype} for planet ${aplanet.name}`);
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
  } else {
    clog('Sorry unable to get your planet list. Issue with NextColony Services.');
  }
  clog(`total GET calls ${getCallsCounter}, longest wait for next rebuild execution is : ${longestwait} sec`);
  console.timeEnd('build-1-Ship');
}

async function getShipyard (yardtype, planetId, planetNama, userid) {
  // new NextColony API- 2019 Nov 11
  let loadshipyard = apiservice + `/planetshipyard?user=${userid}&planet=${planetId}&name=${yardtype}`;
  let planetRss = await loadRss(planetId).catch(err => {clog(err.response.statusText)});
	await timeout(getcalldelay);
  var aShipyard = await get(loadshipyard).catch(err => {clog(err.response.statusText)});
	await timeout(getcalldelay);
  // var aShipyard = myYardList.find(({type})=> type == yardtype);
  if (typeof aShipyard !== 'undefined')
  return {ID : planetId, name:planetNama, ship: yardtype, qualify: shipPossible(aShipyard[0], planetRss, planetNama), time2build: aShipyard[0].costs.time};
};

async function loadRss (planetId) {
  let loadquantity = apiservice + `/loadqyt?id=${planetId}`;
  var myResult = await get(loadquantity);
  return myResult;
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

function getBSJSON (planetId, shipName) {
    let scJson = {};
    let scCommand = {};
    // Create Command
    scJson["username"] = conf.userid;
    scJson["type"] = "buildship";
    scCommand["tr_var1"] = planetId;
    scCommand["tr_var2"] = shipName;

    scJson["command"] = scCommand;
    return JSON.stringify(scJson);
}

function shipPossible(ship, myRss, planetName) {
      //clog(ship);
      if (isBusy(ship.busy_until)) {
        clog(`[${planetName}] sibuk s\'krang`);
        return false;
      }
      if (myRss.coal < ship.costs.coal) {
        clog(`[${planetName}] coal x cukup`);
        return false;
      }
      if (myRss.ore < ship.costs.ore) {
        clog(`[${planetName}] ore x cukup`);
        return false;
      }
      if (myRss.copper < ship.costs.copper) {
        clog(`[${planetName}] copper x cukup`);
        return false;
      }
      if (myRss.uranium < ship.costs.uranium) {
        clog(`[${planetName}] uranium x cukup`);
        return false;
      }
      if (ship.shipyard_level < ship.shipyard_min_level) {
        clog(`[${planetName}] yard level x sampai`);
        return false;
      }
      if (ship.activated === false && ship.variant !== 0) {
        clog(`[${planetName}] x ada cetak biru`);
        return false;
      }
      if (ship.ship_skill < 20) {
        clog(`[${planetName}] x cukup ship skill`);
        return false;
      }
      return true;
}
// need to put it back to sleep base on the time 
async function runAll () {
  console.time('buildAllShips');
	clog(`Fixed Delay in Seconds : [${fixedelay}]`);
  for (var aConfig of conf.profile.credentials) {
    if (aConfig.postingkey !== undefined && aConfig.postingkey.length > 0) {
      if (shiptypeGlobal !== undefined  && shiptypeGlobal.length>0) {
	if (!aConfig.excludeship.includes(shiptypeGlobal)) {
        	await getPlanets(aConfig.postingkey, aConfig.userid, shiptypeGlobal, aConfig.exclude);
	} else {
		clog(`${shiptypeGlobal} is excluded for ${aConfig.userid}`);
	}
      } else {
        	clog('No specified ship to build'); 
      }
    } else {
        clog('No posting key in config');
    }
  }
  console.timeEnd('buildAllShips');
  longestwait = (longestwait <= 60) ? 5400 : longestwait; //put it to wait 1.5 hours = 5400 
  setTimeout(runAll, (fixedelay) * 1000) // convert to miliseconds;
}

//Test unit only
setTimeout(runAll, startdelay*1000);
// qualifyShipyard('corvette','P-ZFCEHUZ1Z9S', 'entahlah');
// loadRss('P-ZFCEHUZ1Z9S');
// clog(JSON.stringify(rssRes));

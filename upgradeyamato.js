var dsteem = require('dsteem');
var myArgs = process.argv.slice(2);
var confile = (myArgs[1] !== undefined)? myArgs[0] : './config_yamato.js';
var startdelay = (myArgs[2] !== undefined)? myArgs[1] : 0; // delay in miliseconds
var conf = require(confile);
var apiservice = conf.apihost;
var moment = require('moment');
var axios = require('axios'); // alternate to node-fetch
var delayfactor = 0;
const timeout = ms => new Promise(res => setTimeout(res, ms));

var client = new dsteem.Client(conf.steemnode);
var getCallsCounter = 0;
var fixedelay = 3600.00; //in seconds.

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

async function sendCustomJSON (planetID, yamato, _delayMS, key, _userid) {

  let my_data = getUYJSON(planetID, yamato, _userid);
  // await timeout(_delayMS);
  clocktime(`Started ${planetID}_${yamato}`);
    await client.broadcast.json({
        required_auths: [],
        required_posting_auths: [_userid],
        id: conf.appid,
        json: my_data,
    }, key).then(
        result => { console.log(planetID, result) },
        error => { console.error(planetID, error) }
    );
    clocktime(`End  ${planetID}_${yamato}`);
   
};

async function buildYamato(postKey, userid, planetIDList) {
    let key = dsteem.PrivateKey.fromString(postKey);
    for (var aPlanetID of planetIDList) {

        let fleetInPlanetURI = apiservice+`/planetfleet?user=${userid}&planet=${aPlanetID}`;
        let fleetListResult = await get(fleetInPlanetURI).catch(err=> clog(err.response.statusText));
        let yamatoOnlyList = fleetListResult.filter(anItem => anItem.class == 'Yamato');
        if (!isArrayEmpty(yamatoOnlyList)) {
            //clog(yamatoOnlyList);
            let yamatoTypeOnly = yamatoOnlyList.map(aYoL => aYoL.type);
            let biggestYamato = findBiggestY(yamatoTypeOnly);
            let splitYamatoType  = biggestYamato.split('yamato');
            let currentYamatoLevel  = (splitYamatoType[1].length > 0) ? parseInt(splitYamatoType[1]) : 0;
            if (currentYamatoLevel < 20) {
                await sendCustomJSON(aPlanetID, 'yamato'+currentYamatoLevel, 1000, key, userid);
            }
        } else {
            clog(`${userid} - ${aPlanetID} No Yamato Found Skipping`);
        }
    }
}

function findBiggestY (arrayOfYamato) {

    let result = '';

    for (var aY of arrayOfYamato) {
        result = (aY > result) ? aY : result; 
    }
    return result;

}

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

function getUYJSON (planetId, shipType, userid) {
    var scJson = {};
    var scCommand = {};
    scJson["username"] = userid;
    scJson["type"] = "upgradeyamato";
    scCommand["tr_var1"] = planetId;
    scCommand["tr_var2"] = shipType;
    scJson["command"] = scCommand;

    return JSON.stringify(scJson);
}

// need to put it back to sleep base on the time 
async function runAll () {
  console.time('upgradeYamato');
	clog(`Fixed Delay in Seconds : [${fixedelay}]`);
  for (var aConfig of conf.profile.credentials) {
    if (aConfig.postingkey !== undefined && aConfig.postingkey.length > 0) {
        await buildYamato(aConfig.postingkey, aConfig.userid, aConfig.planetidlist);
    }
  }
  console.timeEnd('upgradeYamato');
  clog(new Date().toLocaleString());
  setTimeout(runAll, (fixedelay) * 1000) // convert to miliseconds;
}

setTimeout(runAll, startdelay*1000);
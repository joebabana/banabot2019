var ApiService = require('./api.js');
var map2Dee = require("./mapmaker.js");
const fisherYates = require('./fisheryates.js');
var conf = require('./config_autourE2.js');
var sleephours = typeof conf.sleephours == 'number'? conf.sleephours*60*60*1000 : 3600000;
var startdelay = typeof conf.startdelay == 'number'? conf.startdelay*1000 : 0; //in miliseconds
var dsteem = require('dsteem');
var anAPI = new ApiService(conf.apihost);
var client = new dsteem.Client(conf.steemnode);
const timeout = ms => new Promise(res => { clog(`Delay ${ms} ms`); setTimeout(res, ms); });
var joblog = [];

function explorespace(user, originPlanetId, x, y, shiptype) {
    var scJson = {};
    var scCommand = {};
    scJson["username"] = user;
    scJson["type"] = "explorespace";
    scCommand["tr_var1"] = originPlanetId;
    scCommand["tr_var2"] = x;
    scCommand["tr_var3"] = y;
    scCommand["tr_var4"] = shiptype;
    scJson["command"] = scCommand;
    return JSON.stringify(scJson);
}

function clog(msg) { console.log(msg) };

function clocktime(convince) {
    let unixTime = Math.round(+new Date() / 1000);
    clog(`send 2 Steem node ${convince} at ${unixTime}`);
}

async function sendCustomJSON(x, y, originplanet, key, _userid, ship) {

    let my_data = explorespace(_userid, originplanet, x, y, ship);
    // await timeout(_delayMS); // change to multiple 2.5 seconds delay execution reduce the hit to RPC server.
    clocktime(`Started ${originplanet} explore ${x}/${y}`);
    // clog('pseudo explore to ', my_data);
    await client.broadcast.json({
        required_auths: [],
        required_posting_auths: [_userid],
        id: conf.appid,
        json: my_data,
    }, key).then(
        result => { clog( `${originplanet} and ${JSON.stringify(result)}`); joblog.push({planet:originplanet, trxid:result.id, block:result.block_num, trxNo:result.trx_num, xy: x+'/'+y});},
        error => { console.error(originplanet, error) }
    );
    clocktime(`End ${originplanet} explore ${x}/${y}`);

};

async function getUnexploredCoordinates(x, y, size) {
    console.time('Find_Unexplored');
    var targetArea = await anAPI.get(`/loadgalaxy?x=${x}&y=${y}&height=${size * 2}&width=${size * 2}`)
        .catch(err => console.error(err.response.statusText));

    // added exclusion for planets, current exploring mission & already explored tiles.
    let exploredTiles = [...targetArea.explored, ...targetArea.explore, ...targetArea.planets];
    let exploredCoordinates = [];
    exploredTiles.forEach(aM => { exploredCoordinates.push(`${aM.x}/${aM.y}`) });
    let rawCoordinates = new map2Dee(x, y, size, 36); // #TODO remove static number
    rawCoordinates.generateNow();
    let unexploreTiles = rawCoordinates.maparray.filter(a2D => !exploredCoordinates.includes(a2D.k));
    unexploreTiles.sort((a, b) => { return a.d - b.d }); // sort d=distance
    console.timeEnd('Find_Unexplored');
    return unexploreTiles;
}

async function getPlanetDetails(planetID) {
    return await anAPI.get(`/loadplanet?id=${planetID}`);
}
async function getMyPlanets (_userID) {
    return await anAPI.get(`/loadplanets?user=${_userID}&to=1000`);
}
async function getMissionOveriew(userid) {
    return await anAPI.get(`/missionoverview?user=${userid}`);
}

async function loadFleetMissions(planetID, userid) {
    return await anAPI.get(`/loadfleetmission?user=${userid}&active=1&planetid=${planetID}`);
}

async function getPlanetFleet(planetID, userid) {
    return await anAPI.get(`/planetfleet?user=${userid}&planet=${planetID}`);
}

async function runAll() {
	joblog.length=0; //emptying job log
    for (var aProfile of conf.profile.credentials) {
        let _username = aProfile.userid;
        let _mapsize = aProfile.mapsize;
        let key = dsteem.PrivateKey.fromString(aProfile.postingkey);
        var rawPlanetList = await getMyPlanets(_username);
        var taggedPlanets = rawPlanetList.planets.filter(aPLNT => aPLNT.name.includes(aProfile.planetTag));
        if (taggedPlanets.length == 0) clog(`No planets were tagged. Bot does nothing.`);
        for (var aPlanet of taggedPlanets) {
            await timeout(5000); // pause for 30 seconds so can get a better state of account free mission.
            let aPlanetSpecs = await getPlanetDetails(aPlanet.id);
            let activeFleetMission = await loadFleetMissions(aPlanet.id, _username);
            let missionOverview = await getMissionOveriew(_username);
            let planetmissionlimit = Math.floor(aPlanetSpecs.level_base / 2);
            let fleetList = await getPlanetFleet(aPlanet.id, _username);
            let explorerships = fleetList.find(({ type }) => type == 'explorership1');
            let planetfreemissionleft = planetmissionlimit - activeFleetMission.length;

            if (typeof explorerships == 'undefined') explorerships = { quantity: 0 };
            clog(`${aPlanet.name} - Number of explorers-II on this planet : ${explorerships.quantity}`);
            clog(`${aPlanet.name} - Planet scope active exploration ${activeFleetMission.length}`);
            clog(`${aPlanet.name} - User scope mission free : ${missionOverview.free_missions} vs Reserve ${aProfile.reserveslot}`);
            clog(`${aPlanet.name} - Planet scope missions ${planetfreemissionleft}/${planetmissionlimit}`);

            if (missionOverview.free_missions > aProfile.reserveslot) {
                if (explorerships.quantity > 0) {
                    let noOfLaunch = Math.min(missionOverview.free_missions-aProfile.reserveslot, planetfreemissionleft, explorerships.quantity);
                    if (noOfLaunch > 0) {
                        clog(`${aPlanet.name} - We are going to launch exploration with ${noOfLaunch} mission`);
                        let potentialTargets = await getUnexploredCoordinates(aPlanetSpecs.planet_corx, aPlanetSpecs.planet_cory, _mapsize);
                        console.log(potentialTargets.length);
                        if (potentialTargets.length > 0) {
                            let randomizeTargets = (conf.randomize)? fisherYates(potentialTargets):potentialTargets; // Use Fisher Yates Randomizer only if true
                            for (var i = 0; i < noOfLaunch; i++) {
                                clog(`${aPlanet.name} - Table.`);
                                let aTarget = randomizeTargets[i];
                                if (typeof aTarget !== 'undefined'){
                                clog(`${aPlanet.name}  bot to sleep for : ${(aTarget.d * 3600e2) / 1e4} secs`);
                                await sendCustomJSON(aTarget.x, aTarget.y, aPlanet.id, key, _username, 'explorership1');
                                } else {
                                    clog('unable to get randomize planet detail.');
                                }
                            }
                        } else {
                            clog(`${aPlanet.name} - No free tiles. Consider increase map area size.`);
                        }
                    } else {
                        clog(`${aPlanet.name} - No free mission slot, bot do nothing.`);
                    }
                } else {
                    clog(`${aPlanet.name} - No explorer ship on planet, bot do nothing.`)
                }
            } else {
                clog(`${aPlanet.name} - Exceeded your reserve mission slot count. Consider to lower the threshold.`);
            }
        }
    }
    clog('Summary Executions' + new Date().toLocaleString());
    console.table(joblog);
    setTimeout(runAll, sleephours); // 6 hours interval.
}

setTimeout(runAll, startdelay);

var dsteem = require('dsteem');
var moment = require('moment');
var appid = 'nextcolony';
var apiservice = 'https://api.nextcolony.io';
var scanforplanetbelow = 5001; //stardust value
var intervalhb = 500; //miliseconds
var credentials = {
    "steem user":"posting key", 
    "steem next user":"posting key"
};
const timeout = ms => new Promise(res => setTimeout(res, ms));
var axios = require('axios');
async function get(url, config = {}) {
    const response = await axios.get(`${url}`, config);
    if (response.error) {
      return Promise.reject(
        new Error(`Error GET ${url} : ${JSON.stringify(response)}`)
      );
    }
    return response.data;
}
var rpcServer = { "main" : "https://api.steemit.com" , "backup0":"https://anyx.io/"};
var client = new dsteem.Client(rpcServer["main"]);

const streamBlockNumber = async (cb) => {
    let lastBlock = 0;
    setInterval(async () => {
        const head_block_number = await client.blockchain.getCurrentBlockNum(mode = dsteem.BlockchainMode.Latest)
        if (head_block_number && !isNaN(head_block_number)) {
            if (head_block_number > lastBlock) {
                lastBlock = head_block_number
                cb(lastBlock)
            }
        }
    }, intervalhb);
};

const streamBlockOperations = async (cb) => {
    streamBlockNumber(async blockNumber => {
        const result = await client.database.getBlock(blockNumber)
        if (result) {
		console.log(`processing block#${blockNumber}`);
            const operations = result.transactions.map(transaction => {
                return transaction.operations;
            })
            if (operations.length > 0) {
                for (let [operation] of operations) {
                    if (operation[0] == 'custom_json' && operation[1].id == appid) {
                        let ncjsonpayload = JSON.parse(operation[1].json);
                        if (ncjsonpayload.type=='ask'){
                            let ncComm = ncjsonpayload.command;
				console.log(`detected a market ask order ${ncComm.tr_var2}`);
                            if (ncComm.tr_var1 == 'planet' && ncComm.tr_var3 < scanforplanetbelow) {
                                // Target found.
                                // Get ASK id from NextColony API
                                //clocktime('START TargetLocked');
                                let getAskURI = apiservice+`/asks?uid=${ncComm.tr_var2}&active=1`;
                                let retry = 15; 
                                let notfound = true;
                                while(retry > 0 && notfound) {
                                    await timeout(1000);
                                    let askdetails = await get(getAskURI).catch(err => console.error(err));
                                    if (typeof askdetails !== 'undefined' && askdetails.length) {
                                        cb(askdetails[0].id, ncComm);
                                        notfound = false;
                                    }
                                    retry--;
					console.log(`failed to get ask details, retrying ${retry}`);
                                }
                                //clocktime('END TargetLocked');
                            }
                        }
                    }
                }
            }
        }
    })
};

function get_fill_ask(user, askId) {
    var scJson = {};
    var scCommand = {};
    // Create Command
    scJson["username"] = user;
    scJson["type"] = "fill_ask";
    scCommand["tr_var1"] = askId;

    scJson["command"] = scCommand;
    return JSON.stringify(scJson);
}

function getrenameplanet(user, askId) {
    var scJson = {};
    var scCommand = {};
    // Create Command
    scJson["username"] = user;
    scJson["type"] = "renameplanet";
    scCommand["tr_var1"] = askId;
    scCommand["tr_var2"] = "LeiLowMei_TEST";

    scJson["command"] = scCommand;
    return JSON.stringify(scJson);
}

async function sendCustomJSON(userid, _attackJSON) {
    //await timeout(_delayMS); // change to multiple 2.5 seconds delay execution reduce the hit to RPC server.
    let local_client = new dsteem.Client('https://api.steemit.com');
    clocktime(`Started attempt fill ask`);
    let signKey =  dsteem.PrivateKey.fromString(credentials[userid]);
    await local_client.broadcast.json({
        required_auths: [],
        required_posting_auths: [userid],
        id: appid,
        json: _attackJSON,
    }, signKey).then(
        result => { console.log(result) },
        error => { console.error(error) }
    );
    clocktime(`End attempt.`);
};

function clocktime(convince) {
    let datenow = new Date();
    let formattedDate = moment(datenow).format("DD MMM YYYY hh:mm:ss");
    let unixTime = Math.round(datenow / 1000);
    console.log(` running ${convince} at ${unixTime} or ${formattedDate}`);
}

streamBlockOperations((askID, comdata)=> {
    //console.table(get_fill_ask('delta-clan', data.tr_var2));
    sendCustomJSON('delta-clan', get_fill_ask('delta-clan', askID));
    // for test only sendCustomJSON('joebabana', getrenameplanet('joebabana', data.tr_var2));
    console.log(askID);
    console.table(comdata);
});

console.log('Start Planet Sniper 1.0');

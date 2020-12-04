var ncc = {};

ncc.appid = 'nextcolony';
ncc.steemnode = 'https://api.steemit.com'; // chg to any available node in service check here -https://geo.steem.pl/
ncc.apihost = 'https://api.nextcolony.io'; // game host API
ncc.sleephours = 6;
ncc.startdelay = 5; // 7 hours delay at start

// your main or alt steem account / user name
//use posting key only.
ncc.profile = { 
	credentials: [
    {
            "userid":"",
            "postingkey":"",
            "reserveslot":2,
            "mapsize":72,
            "planetTag":"ZC59F",
		"randomize":true
    }
]};

module.exports=ncc;

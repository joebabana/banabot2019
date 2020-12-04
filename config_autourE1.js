var ncc = {};

ncc.appid = 'nextcolony';
ncc.steemnode = 'https://api.steemit.com'; // chg to any available node in service check here -https://geo.steem.pl/
ncc.apihost = 'https://api.nextcolony.io'; // game host API
ncc.sleephours = 1;
ncc.startdelay = 10;

// your main or alt steem account / user name
//use posting key only.
ncc.profile = { 
	credentials: [
    {
        "userid":"",
        "postingkey":"", 
        "reserveslot":10,
        "mapsize":20,
        "planetTag":"",
	"randomize":false
    },
    {
        "userid":"",
        "postingkey":"",
        "reserveslot":2,
        "mapsize":30,
        "planetTag":"",
        "randomize":true

    }
]};

module.exports=ncc;

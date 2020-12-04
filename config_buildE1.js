var ncc = {};

ncc.appid = 'nextcolony';
ncc.steemnode = 'https://api.steemit.com'; // chg to any available node in service check here -https://geo.steem.pl/
ncc.apihost = 'https://api.nextcolony.io'; // game host API

// your main or alt steem account / user name
//use posting key only.
ncc.profile = { 
	credentials: [
	{
		"userid":"",
		"postingkey":"", 
		"excludeship":["scout","patrol"],
		"exclude":[]
	}
]};

//	"excludeship":["corvette","corvette2","frigate","destroyer"],
module.exports=ncc;

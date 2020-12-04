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
		"excludebuild":["researchcenter","shieldgenerator","bunker"],
		"includebuild":["base","coalmine", "oremine", "coppermine", "uraniummine","shipyard" ,"coaldepot", "oredepot",  "copperdepot", "uraniumdepot"],
		"exclude":["13UfeAtez","1C2PA3556", "1CuPA3556", "12BB22","7X15Y","7XY00","7A001","7B001","7X18Y","7D005","3C003"]
	},
	{
		"userid":"",
		"postingkey":"", 
		"excludebuild":["researchcenter","shieldgenerator","bunker"],
		"includebuild":["base","coalmine", "oremine", "coppermine", "uraniummine","shipyard" ,"coaldepot", "oredepot",  "copperdepot", "uraniumdepot"],
		"exclude":["Delta-C7Ore999","DeltaC12Coal_FDC88","DeltaC13Coal_FDC88","DeltaC14Coal_FDC88","DeltaC15Earth_FDC88","DeltaC16Earth_FDC88"]
	}
]};

//	"excludeship":["corvette","corvette2","frigate","destroyer"],
module.exports=ncc;

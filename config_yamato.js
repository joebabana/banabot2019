var ncc = {};

ncc.appid = 'nextcolony';
ncc.steemnode = 'https://api.steemit.com'; // chg to any available node in service check here -https://geo.steem.pl/
ncc.apihost = 'https://api.nextcolony.io'; // game host API

// your main or alt steem account / user name
// use posting key only.
// P-ZEKTAVOHFW0 - 2C004
// P-ZH06W4A0D9C - 2C002
// "planetidlist":["P-ZLV9LUKTG5S","P-ZCLHW3B8QGW","P-ZHDUTY1YMLC","P-Z8243ABJEA8","P-Z68GFHWR0N4","P-Z3OQI4EWO5S","P-ZJJL73S1RXC"]
// P-ZRW0TUPAGUO - 2XY02
//
ncc.profile = { 
	credentials: [
	{
	"userid":"",
	"postingkey":"", 
    "planetidlist":["P-Z1V4BQCQCF4"]
    }
]};

module.exports=ncc;

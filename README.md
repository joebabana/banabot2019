Not-so Brief Setup Guide ANymore. (Nov 14, 2019)
=================================

The files.
----------
1. config.js - contains your posting key, username, exculsion ship2build, exclusion planet2probe.

2. buildship3.js - Downloads a user's planets, shipyard info, each planet resources. Compares and qualify which planet can build the type of ship requested.

3. symbolic link files not included.


Steps.
------
1. Install NodeJS of your OS Choice
2. Extract the content into a folder.
3. Install PM2 
## #!/bin/bash
sudo yum update -y
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.nvm/nvm.sh
nvm install 10.16.0
sudo yum install -y git
npm install -g pm2

4. Each symbolic links to buildship3.js. For e.g. Symbolink is "ln -s buildship3.js <shiptype_name>.js". One ship type for one pm2 process. Each process iterates through a list of accounts, qualifies the account and send out buildship customjson.
4a. UPDATE : buildship3.js (taking the longest build time of a ship as the sleep time), buildship4.js (takes in 2 parameters config*.file & shiptype & fixed delay time of x seconds.)
5. Then add the process into PM2 using "pm2 start <shiptype_name>.js -- <shiptype_name>" then "pm2 save".
For eg.
~  "pm2 start corvette1.js -- corvette1" or "pm2 start carrier.js -- carrier"

Important.
---------
While editing the config.js. Please be aware of the JSON array formatting for credentials. 
The last object should end with a comma (,).
Otherwise the buildship2 script will fail. 
Careful with cut-n-paste.

If you have single account, kindly remove the rest of the Credentials and leave one for your use.

### Updates
1) create a symlink to buildship3.js
 ln -s buildships4.js cutter2.js
then
pm2 start  corvette.js -- corvette ./config.js 5400
pm2 start  frigate.js -- frigate ./config.js 7200
pm2 start  destroyer.js -- destroyer ./config.js 9000
pm2 start  cruiser.js -- cruiser ./config.js 10800
pm2 start  battlecruiser.js -- battlecruiser ./config.js 12600
pm2 start  cutter2.js -- cutter2 ./config.js 14400
pm2 start  corvette2.js -- corvette2 ./config.js 16200
pm2 start  corvette1.js -- corvette1 ./config.js 18000
pm2 start  frigate2.js -- frigate2 ./config.js 19800
pm2 start  carrier.js -- carrier ./config.js 21600

2) civilian ships difference script
ln -s buildships4.js explorer1.js
pm2 start explorer1.js -- explorership ./config_buildE1.js 1800 - delay

3) building upgrade
pm2 start upgradebuildings.js -- ./config_ub.js  1  - delay start.



4) Java NextValium GUI
a) Check trust cert in java store - keytool -list -v -keystore cacerts -alias nextcolony
b) finally got it to work - certificate must be acquired with firefox to the website or api host url itself, export and save into a file for JAva to import in.

keytool -import -alias api.nextcolony.io -file .\api_nextcolony_io.crt -keystore "C:\Program Files\Java\jdk1.8.0_71\jre\lib\security\cacerts"

keytool -delete -alias aliasToRemove -keystore keystoreCopy.jks

c) To test if it connects use : java SSLPoke api.nextcolony.io 443



module.exports = function ($logger, $projectData, $usbLiveSyncService) {
    var liveSync = $usbLiveSyncService.isInitialized;

    if (liveSync) {
        return;
    }

    var fs = require('fs'),
        path = require('path');


    var nodeFolder = path.join(__dirname, '../../node_modules');

    // +++ fix node_modules/ethers-wallet/words.json
    patchFile(path.join(nodeFolder, 'ethers-wallet/words.json'), '{"words": ', [], '{"words": ', '}');
    // --- end fix node_modules/ethers-wallet/words.json

    // +++ fix node_modules/ethers-wallet/hdnode.js
    patchFile(path.join(nodeFolder, 'ethers-wallet/hdnode.js'), '//+++PATCHED---//', [['var words = require(\'./words.json\');', 'var words = require(\'./words.json\').words;']], '//+++PATCHED---//\n');
    // --- end fix node_modules/ethers-wallet/hdnode.js

    // +++ fix node_modules/ethers-wallet/wallet.js
    patchFile(path.join(nodeFolder, 'ethers-wallet/wallet.js'), '//+++PATCHED---//', [['require(\'setimmediate\');', '//require(\'setimmediate\');']], '//+++PATCHED---//\n');
    // --- end fix node_modules/ethers-wallet/wallet.js


    // +++ fix node_modules/stream-http/index.js
    patchFile(path.join(nodeFolder, 'stream-http/index.js'), '//+++PATCHED---//', [['var defaultProtocol = global.location.protocol.search(/^https?:$/) === -1 ? \'http:\' : \'\'', 'var defaultProtocol = \'http\'']], '//+++PATCHED---//\n');
    // --- end fix node_modules/stream-http/index.js

    // +++ fix node_modules/xmlhttprequest/lib/XMLHttpRequest.js
    patchFile(path.join(nodeFolder, 'xmlhttprequest/lib/XMLHttpRequest.js'), '//+++PATCHED---//', [['var http = require("http");', 'var http = require("stream-http");']], '//+++PATCHED---//\n');
    // --- end fix node_modules/xmlhttprequest/lib.XMLHttpRequest.js

    // +++ fix node_modules/https-browserify/index.js
    patchFile(path.join(nodeFolder, 'https-browserify/index.js'), '//+++PATCHED---//', [['var http = require(\'http\');', 'var http = require("stream-http");']], '//+++PATCHED---//\n');
    // --- end fix node_modules/https-browserify/index.js

    // +++ fix node_modules/inherits/inherits.js
    patchFile(path.join(nodeFolder, 'inherits/inherits.js'), '//+++PATCHED---//', [['*', 'module.exports = require(\'./inherits_browser.js\');']], '//+++PATCHED---//\n');
    // --- end fix node_modules/inherits/inherits.js

    // +++ fix node_modules/nativescript-nodeify/patch-platforms.js
    patchFile(path.join(nodeFolder, 'nativescript-nodeify/patch-platforms.js'), '//+++PATCHED---//', [['var path = require("path");', 'var appFilesUpdaterOptions = (hookArgs && hookArgs.appFilesUpdaterOptions) || {};\nif (appFilesUpdaterOptions.bundle){ return;}\nvar path = require("path");\n']], '//+++PATCHED---//\n');
    // --- end fix node_modules/nativescript-nodeify/patch-platforms.js

    function patchFile(fpath, condition, replaces, pref, suff) {
        console.log('+++ patch ' + fpath);
        replaces = replaces || [];
        pref = pref || '';
        suff = suff || '';
        var f = fs.readFileSync(fpath, 'utf8');
        if(f.indexOf(condition) == -1) {
            for(var i = 0; i < replaces.length; i++){
                if(replaces[i][0] == "*" ) {
                    f = replaces[i][1];
                }
                else {
                    f = f.replace(replaces[i][0], replaces[i][1]);
                }
            }
            f = pref + f + suff;
            fs.writeFileSync(fpath, f);
        }
        console.log('--- patch ' + fpath);
    }
};


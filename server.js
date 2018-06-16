var express = require('express');
var config = require('./config');
var fs = require('fs');
var path = require('path');
var parse = require('3gpp-asn1-parser');

var asn1PerSpec = {};
var asn1Dir = './resources';
var files = fs.readdirSync(path.resolve(__dirname, asn1Dir));
for (let filename of files) {
    let input = fs.readFileSync(path.resolve(__dirname, asn1Dir, filename), 'utf8');
    asn1PerSpec[filename] = parse(input);
}

function getAsn1ByNameAll(name) {
    var ret = {};
    for (let spec of Object.keys(asn1PerSpec)) {
        let retModule = {};
        for (let moduleName of Object.keys(asn1PerSpec[spec])) {
            let asn1 = asn1PerSpec[spec][moduleName][name];
            if (!asn1) {
                continue;
            }
            retModule[moduleName] = asn1;
        }
        if (!Object.keys(retModule).length) {
            continue;
        }
        ret[spec] = retModule;
    }
    return ret;
}

function getAsn1OwnerAll(name) {
    var ret = {};
    for (let spec of Object.keys(asn1PerSpec)) {
        let retPerSpec = {};
        for (let moduleName of Object.keys(asn1PerSpec[spec])) {
            let retPerModule = {};
            for (let key of Object.keys(asn1PerSpec[spec][moduleName])) {
                let obj = asn1PerSpec[spec][moduleName][key];
                if ('inventory' in obj && obj['inventory'].includes(name)) {
                    retPerModule[key] = obj;
                }
            }
            if (!Object.keys(retPerModule).length) {
                continue;
            }
            retPerSpec[moduleName] = retPerModule;
        }
        if (!Object.keys(retPerSpec).length) {
            continue;
        }
        ret[spec] = retPerSpec;
    }
    return ret;
}

function setupExpress(app, prefix = '') {
    app.get(`${prefix}/`, function(req, res) {
        res.render('asn1');
    });
    app.get(`${prefix}/get/:name`, function(req, res) {
        res.json(getAsn1ByNameAll(req.params.name));
    });
    app.get(`${prefix}/owner/:name`, function(req, res) {
        res.json(getAsn1OwnerAll(req.params.name));
    });
}
exports.setupExpress = setupExpress;

if (require.main == module) {
    var app = express();
    app.set('view engine', 'pug');
    app.set('views', 'views');
    setupExpress(app);
    app.listen(config.port, function() {
        console.log(`Listening on port ${config.port}`);
    });
}

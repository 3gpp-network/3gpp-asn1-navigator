var express = require('express');
var config = require('./config');
var asn1PerSpec = require('./jison/asn1');

function getAsn1ByName(name) {
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

function getAsn1Owner(name) {
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

exports.api = {
    getAsn1ByName: getAsn1ByName,
    getAsn1Owner: getAsn1Owner,
};

function setupExpress(app, prefix = '') {
    app.get(`${prefix}/`, function(req, res) {
        res.render('asn1');
    });
    app.get(`${prefix}/get/:name`, function(req, res) {
        res.json(getAsn1ByName(req.params.name));
    });
    app.get(`${prefix}/owner/:name`, function(req, res) {
        res.json(getAsn1Owner(req.params.name));
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

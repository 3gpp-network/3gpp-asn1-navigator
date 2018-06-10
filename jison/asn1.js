var fs = require('fs');
var jison = require('jison');
var path = require('path');
var bnf = fs.readFileSync(path.resolve(__dirname, 'asn1.jison'), 'utf8');
var parser = new jison.Parser(bnf);

var asn1PerSpec = {};

module.exports = exports = asn1PerSpec;

var asn1Dir = '../resources';
var files = fs.readdirSync(path.resolve(__dirname, asn1Dir));
for (var file of files) {
    let input = fs.readFileSync(path.resolve(__dirname, asn1Dir, file), 'utf8');
    asn1PerSpec[file] = parser.parse(input);
}


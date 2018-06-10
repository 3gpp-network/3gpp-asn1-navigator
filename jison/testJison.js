var fs = require('fs');
var jison = require('jison');
var bnf = fs.readFileSync('./asn1.jison', 'utf8');
var parser = new jison.Parser(bnf);

var input = fs.readFileSync(process.argv[2], 'utf8');
console.log(JSON.stringify(parser.parse(input), null, 2));

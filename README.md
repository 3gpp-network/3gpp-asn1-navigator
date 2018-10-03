# 3GPP ASN.1 Navigator

Navigate ASN.1 by its name or find its owner

## Dependencies

```sh
npm install express jison pug
git clone https://github.com/gsongosng/3gpp-asn1-parser
npm link 3gpp-asn1-parser
```

## Usage

First, put all text files containing ASN.1 under `resources` directory

### Standalone

Copy `config.json.example` to `config.json` and edit `port`

```sh
node server
```

### Used from Other

*NOTE: Not completed*

- Copy files (for view named `asn1`) under `views` to a proper directory

```js
var app = express();
app.set('view engine', 'pug');
app.set('views', 'views');
// Some express configurations
var server = require('./3gpp-asn1-navigator');
server.setupExpress(app, '/asn1-nav');
app.listen(3000);
```

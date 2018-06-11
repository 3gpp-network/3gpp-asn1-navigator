# 3GPP ASN.1 Navigator

Navigate ASN.1 by its name or find its owner

## Dependencies

```sh
npm install express jison pug
```

## Usage

### Standalone

Copy `config.js.example` to `config.js` and edit `port`

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

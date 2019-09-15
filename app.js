let express = require('express'),
    app = express(),
    http = require('http'),
    https = require('https'),
    path = require('path'),
    fs = require('fs'),
    responseUltis = require('./core/ResponseUtils'),
    configs = require('./core/config'),
    logger = require('morgan'),
    compression = require('compression'),
    moment = require('moment'),
    port = configs.PORT;

// On Window it requires https://github.com/nodejs/node-gyp#installation
// Pass 123: $2a$10$qkBhcz1bTsPEsZFNAyAK..TSqjehm8piCfJMnoobbtFGNTIo4pSIq
// Set global function to avoid using console.log
app.use(logger("dev"));
app.use(compression());

require('./core/globals')
require('./core/passport');
require('./core/express-config')(app);
require('./routes/router')(app);

app.use(function (request, response) {
  // Instead of 404 error response.end("404!");
  response.redirect('/');
});

const httpServer = http.createServer(app);
// SSL Configuration
if (configs.enableSSL) {
  const privateKey = fs.readFileSync(configs.privateKey, 'utf8');
  const certificate = fs.readFileSync(configs.certificate, 'utf8');
  const ca = fs.readFileSync(configs.ca, 'utf8');

  const credentials = {
    key: privateKey,
    cert: certificate,
    ca: ca
  };

  // Starting both http & https servers
  const httpsServer = https.createServer(credentials, app);

  httpsServer.listen(443, () => {
    console.log('Public server  running at port ' + 443);
    console.log('\tAT:' + new Date());
  });

  // Redirect from http port to https
  http.createServer(function (req, res) {
      res.writeHead(301, { "Location": "https://" + req.headers['host'] + req.url });
      res.end();
  }).listen(port);

} else {
  httpServer.listen(port, () => {
    console.log('Public server  running at port ' + port);
    console.log('\tAT:' + new Date());
  });
}

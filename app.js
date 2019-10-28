let express = require('express'),
    app = express(),
    http = require('http'),
    configs = require('./core/config'),
    logger = require('morgan'),
    compression = require('compression'),
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

const httpServer = http.createServer(app);

httpServer.listen(port, () => {
  console.log('Public server  running at port ' + port);
  console.log('\tAT:' + new Date());
});

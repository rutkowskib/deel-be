const express = require('express');
const bodyParser = require('body-parser');
const { sequelize } = require('./db');
const { router: contractsRouter } = require('./routes/contracts');
const { router: jobsRouter } = require('./routes/jobs');
const { router: adminRouter } = require('./routes/admin');
const { router: balancesRouter } = require('./routes/balances');
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize);
app.set('models', sequelize.models);

app.use('/contracts', contractsRouter);
app.use('/jobs', jobsRouter);
app.use('/admin', adminRouter);
app.use('/balances', balancesRouter);

module.exports = app;

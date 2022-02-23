const express = require('express');
const bodyParser = require('body-parser');
const {sequelize} = require('./db');
const {router: contractsRouter} = require('./routes/contracts');
const app = express();
app.use(bodyParser.json());
app.set('sequelize', sequelize)
app.set('models', sequelize.models)

app.use('/contracts', contractsRouter);

module.exports = app;

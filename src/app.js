const express = require('express');
const bodyParser = require('body-parser');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
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

// Swagger config
const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Deel BE',
      version: '1.0.0',
    },
  },
  apis: ['./src/routes/*.js'],
};

// Swagger available at localhost:3001/api
app.use('/api', swaggerUi.serve, swaggerUi.setup(swaggerJsdoc(options)));

module.exports = app;

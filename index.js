const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const mongodb = require('mongodb');
const mongoClient = mongodb.MongoClient;

const matchRoutes = require('./routes/matchRoutes');

const app = express();
const PORT = process.env.PORT || 8000;
dotenv.config();

app.use(express.json());
app.use(cors());

app.use('/api/matches', matchRoutes);

app.listen(PORT, console.log(`:::server is up and running at port ${PORT}:::`));

const express = require('express');
const dotenv = require('dotenv');
const mongodb = require('mongodb');
const { MongoClient } = require('mongodb');
const router = express.Router();
dotenv.config();
const DB_URL = process.env.DB_URL;
const DB = process.env.DB;
const DB_MATCHES_COLLECTION = process.env.DB_MATCHES_COLLECTION;

// desc     get all matches
// route    GET /api/matches
// auth     public
router.get('/', async (req, res) => {
	try {
		let client = await MongoClient.connect(DB_URL, { useUnifiedTopology: true });
		let db = client.db(DB);
		let data = await db.collection(DB_MATCHES_COLLECTION).find().toArray();
		client.close();
		res.status(200).json(data);
	} catch (error) {
		console.log(error);
		client.close();
		res.status(400).json({ message: 'Something went wrong' });
	}
});

// desc     get single matches
// route    GET /api/matches/:id
// auth     public
router.get('/:id', async (req, res) => {
	try {
		let client = await MongoClient.connect(DB_URL, { useUnifiedTopology: true });
		let db = client.db(DB);
		let match = await db
			.collection(DB_MATCHES_COLLECTION)
			.findOne({ _id: mongodb.ObjectID(req.params.id) });
		res.status(200).json(match);
		client.close();
	} catch (error) {
		console.log(error);
		client.close();
		res.status(404).json({ message: 'Something went wrong' });
	}
});
module.exports = router;

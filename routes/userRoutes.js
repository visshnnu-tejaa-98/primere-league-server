const express = require('express');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const mongodb = require('mongodb');
const { MongoClient } = require('mongodb');

const { generateHash } = require('../utils/encrypt');
const { generateToken, Authenticate } = require('../utils/auth');
const {
	sendMailToUser,
	addSubject,
	addEmail,
	addHTML,
	sendResetPassword,
} = require('../utils/mail');

const router = express.Router();
dotenv.config();
const DB_URL = process.env.DB_URL;
const DB = process.env.DB;
const DB_USERS_COLLECTION = process.env.DB_USERS_COLLECTION;

// desc     Register a user
// route    POST /api/users
// auth     public
router.post('/register', async (req, res) => {
	try {
		console.log(req.body);
		let client = await MongoClient.connect(DB_URL, { useUnifiedTopology: true });
		let db = client.db(DB);
		let user = await db.collection(DB_USERS_COLLECTION).findOne({ email: req.body.email });
		if (!user) {
			if (req.body.password === req.body.conformPassword) {
				const hash = await generateHash(req.body.password);
				req.body.password = hash;
				await db.collection(DB_USERS_COLLECTION).insertOne({
					name: req.body.name,
					email: req.body.email,
					password: req.body.password,
					favouriteTeam: '',
				});
				addEmail(req.body.email, process.env.EMAIL);
				addSubject('Registration Sucessful!!!');
				addHTML(req.body.name, process.env.FRONTEND);
				sendMailToUser();
				res.status(201).json({ message: 'New User Created!' });
			} else {
				res.status(400).json({ message: 'Passwords need to be match' });
			}
		} else {
			res.status(400).json({ message: 'User Already exists' });
		}
		client.close();
	} catch (error) {
		console.log(error);
		client.close();
		res.status(400).json({ message: 'Something went wrong' });
	}
});

// desc login user
// @route POST /api/users/login
// @access public
router.post('/login', async (req, res) => {
	try {
		let client = await MongoClient.connect(DB_URL, { useUnifiedTopology: true });
		let db = client.db(DB);
		let user = await db.collection(DB_USERS_COLLECTION).findOne({ email: req.body.email });
		if (user) {
			let result = await bcrypt.compare(req.body.password, user.password);

			if (result) {
				let token = await generateToken(user.id);

				res.status(200).json({
					id: user._id,
					email: user.email,
					name: user.name,
					favouriteTeam: user.favouriteTeam,
					token: token,
				});
			} else {
				res.status(401).json({ message: 'Incorret Password' });
			}
		} else {
			res.status(400).json({ message: 'Invalid Email Entered' });
		}
	} catch (error) {
		console.log(error);
		res.status(400).json({ message: 'Something went wrong' });
	}
});

// desc forgot user
// @route POST /api/users/forgot
// @access public
router.post('/forgot', async (req, res) => {
	try {
		let client = await MongoClient.connect(DB_URL, { useUnifiedTopology: true });
		let db = client.db(DB);
		let user = await db.collection(DB_USERS_COLLECTION).findOne({ email: req.body.email });

		if (user) {
			addEmail(req.body.email, process.env.EMAIL);
			addSubject('Reset Your Password!!!');
			sendResetPassword(user.name, process.env.FRONTEND + `/reset/${user._id}`);
			sendMailToUser();
			res.status(201).json({ message: '😀 Mail Sent to the user, Check Your Email' });
		} else {
			res.status(404).json({ message: "😞 You doesn't have an account, Please Register" });
		}
	} catch (error) {
		console.log(error);
		res.status(400).json({ message: '😞 Something went wrong, Please try Again' });
	}
});

// desc Reset user
// @route PUT /api/users/reset
// @access public
router.put('/reset/:id', async (req, res) => {
	try {
		console.log(req.body);
		let client = await MongoClient.connect(DB_URL, { useUnifiedTopology: true });
		let db = client.db(DB);
		let user = await db
			.collection(DB_USERS_COLLECTION)
			.findOne({ _id: mongodb.ObjectID(req.params.id) });
		if (user) {
			if (req.body.password === req.body.conformPassword) {
				let hash = await generateHash(req.body.password);
				req.body.password = hash;
				await db
					.collection(DB_USERS_COLLECTION)
					.updateOne(
						{ _id: mongodb.ObjectID(req.params.id) },
						{ $set: { password: req.body.password } }
					);
				res.status(200).json({ message: 'Password Updated' });
			} else {
				res.status(400).json({ message: 'Passwords need to be match!' });
			}
		}
	} catch (error) {
		console.log(error);
		res.status(400).json({ message: '😞 Something went wrong, Please try Again' });
	}
});

// desc add favourite Team
// @route PUT /api/users/favouriteTeam
// @access private
router.put('/favouriteTeam', Authenticate, async (req, res) => {
	try {
		console.log(req.body);
		let client = await MongoClient.connect(DB_URL, { useUnifiedTopology: true });
		let db = client.db(DB);
		let user = await db.collection(DB_USERS_COLLECTION).findOne({ email: req.body.email });
		console.log(user);
		if (user) {
			await db
				.collection(DB_USERS_COLLECTION)
				.updateOne({ email: user.email }, { $set: { favouriteTeam: req.body.favouriteTeam } });
			const updatedUser = await db
				.collection(DB_USERS_COLLECTION)
				.findOne({ email: req.body.email });
			console.log(updatedUser);
			res.status(201).json(updatedUser);
		}
		client.close();
	} catch (error) {
		console.log(error);
		res.status(400).json({ message: '😞 Something went wrong, Please try Again' });
	}
});
module.exports = router;

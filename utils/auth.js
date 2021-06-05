const jwt = require('jsonwebtoken');

const generateToken = (id) => {
	const token = jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '1h' });
	return token;
};

const Authenticate = async (req, res, next) => {
	try {
		const bearer = await req.headers['authorization'];
		if (!bearer) return res.json({ message: 'access failed' });
		jwt.verify(bearer, process.env.JWT_SECRET, (err, data) => {
			if (data) {
				next();
			} else res.json({ message: 'autorization failed' });
		});
	} catch (error) {
		return res.json({ message: 'something went wrong in authentication' });
	}
};

module.exports = { generateToken, Authenticate };

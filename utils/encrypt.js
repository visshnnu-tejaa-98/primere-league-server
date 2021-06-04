const bcrypt = require('bcryptjs');
const generateHash = async (password) => {
	const salt = await bcrypt.genSalt(10);
	const hash = await bcrypt.hashSync(password, salt);
	return hash;
};

module.exports = { generateHash };

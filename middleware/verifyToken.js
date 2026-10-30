const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const token = req.cookies.token || (req.headers.authorization && req.headers.authorization.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);
  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      return next();
    } catch (err) {
    }
  }
  const auth = req.headers.authorization;
  if (auth && auth.startsWith('Basic ')) {
    const base64Credentials = auth.split(' ')[1];
    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
    const [username, password] = credentials.split(':');
    if (
      username === process.env.BASIC_AUTH_USER &&
      password === process.env.BASIC_AUTH_PASS
    ) {
      return next();
    }
  }
  return res.status(401).json({ success: false, message: 'Unauthorized: Invalid session or credentials' });
};
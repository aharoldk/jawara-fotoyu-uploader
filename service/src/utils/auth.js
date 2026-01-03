const { verify } = require('./jwt');

function authenticate(req, res, next) {
    const token = req.headers['authorization'];
    const source = req.headers['source'];
    if (!token || !source) {
        return res.status(401).json({ error: 'Missing token or source header' });
    }
    const payload = verify(token.replace('Bearer ', ''));
    if (!payload || payload.source !== source) {
        return res.status(401).json({ error: 'Invalid token or source' });
    }
    req.user = payload;
    next();
}

module.exports = { authenticate };
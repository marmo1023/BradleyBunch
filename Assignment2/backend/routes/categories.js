const express = require('express');

module.exports = (dbInstance) => {
    const router = express.Router();
    const categories = dbInstance.getDb().collection('categories');
    const users = dbInstance.getDb().collection('users');

    async function getUserId(username) {
        const user = await users.findOne({ username });
        return user?._id;
    }

    router.get('/', async (req, res) => {
        if (!req.session.username) return res.status(401).json({ error: 'Not logged in' });

        const userId = await getUserId(req.session.username);
        const doc = await categories.findOne({ userId });
        res.json({ categories: doc?.categories || [] });
    });

    return router;
};
const express = require('express');

module.exports = (dbInstance) => {
    const router = express.Router();
    const categories = dbInstance.getDb().collection('categories');
    const users = dbInstance.getDb().collection('users');

    // Get categories for the logged-in user
    router.get('/', async (req, res) => {
        try {
            //Check if user is logged in
            if (!req.session.username) return res.status(401).json({ error: 'Not logged in' });

            // Get user ID
            const userId = (await users.findOne({ username: req.session.username }))?._id;
            if (!userId) return res.status(400).json({ error: 'User not found' });

            // Get categories
            const doc = await categories.findOne({ userId });

            // Return categories
            if (!doc) return res.json({ categories: [] });
            return res.json({ categories: doc?.categories });
        } catch (error) { return res.status(500).json({ error: 'Internal server error' }); }
    });
    return router;
};
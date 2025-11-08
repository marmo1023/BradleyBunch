const express = require('express');

module.exports = (dbInstance) => {
    const router = express.Router();
    const transactions = dbInstance.getDb().collection('transactions');
    const users = dbInstance.getDb().collection('users');

    async function getUserId(username) {
        const user = await users.findOne({ username });
        return user?._id;
    }

    router.get('/summary/categories', async (req, res) => {
        try {
            if (!req.session.username) return res.status(401).json({ error: 'Not logged in' });
            const userId = await getUserId(req.session.username);

            const pipeline = [
                { $match: { userId } },
                { $group: { _id: "$category", total: { $sum: "$amount" } } },
                { $sort: { total: -1 } }
            ];

            const summary = await transactions.aggregate(pipeline).toArray();
            res.json({ success: true, data: summary });
        } catch (err) { res.status(500).json({ error: 'Failed to fetch summary' }); }
    });

    router.get('/all', async (req, res) => {
        try {
            if (!req.session.username) return res.status(401).json({ error: 'Not logged in' });
            const userId = await getUserId(req.session.username);
            const history = await transactions.find({ userId }).sort({ timestamp: -1 }).toArray();
            res.json({ success: true, data: history });
        } catch (err) { res.status(500).json({ error: 'Failed to fetch transactions' }); }
    });

    router.get('/:accountType', async (req, res) => {
        try {
            if (!req.session.username) return res.status(401).json({ error: 'Not logged in' });
            const userId = await getUserId(req.session.username);
            const { accountType } = req.params;

            const validTypes = ['checking', 'savings', 'other'];
            if (!validTypes.includes(accountType)) {
                return res.status(400).json({ error: 'Invalid account type' });
            }

            const history = await transactions.find({ userId, accountType }).sort({ timestamp: -1 }).toArray();
            res.json({ success: true, data: history });
        } catch (err) { res.status(500).json({ error: 'Failed to fetch account history' }); }
    });

    return router;
};
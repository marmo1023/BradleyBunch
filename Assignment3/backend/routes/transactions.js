const express = require('express');

module.exports = (dbInstance) => {
    const router = express.Router();
    const transactions = dbInstance.getDb().collection('transactions');
    const users = dbInstance.getDb().collection('users');

    //Helper Function
    async function getUserId(username) { return (await users.findOne({ username }))?._id; }

    //Get Category Summary
    router.get('/summary/categories', async (req, res) => {
        try {
            //Check that user is logged in
            if (!req.session.username) return res.status(401).json({ error: 'Not logged in' });

            //Get User ID
            const userId = await getUserId(req.session.username);

            //Aggregation Pipeline
            const pipeline = [
                { $match: { userId } },
                { $group: { _id: "$category", total: { $sum: "$amount" } } },
                { $sort: { total: -1 } }
            ];

            //Execute Aggregation
            const summary = await transactions.aggregate(pipeline).toArray();

            //Return Summary
            res.json({ success: true, data: summary });
        } catch (err) { res.status(500).json({ error: 'Failed to get Summary' }); }
    });

    //Transaction History
    router.get('/all', async (req, res) => {
        try {
            //Check that user is logged in
            if (!req.session.username) return res.status(401).json({ error: 'Not logged in' });

            //Get User ID
            const userId = await getUserId(req.session.username);

            //Fetch transaction history
            const history = await transactions.find({ userId }).sort({ timestamp: -1 }).toArray();

            //Return transaction history
            res.json({ success: true, data: history });
        } catch (err) { res.status(500).json({ error: 'Failed to fetch transactions' }); }
    });

    //Get Transaction History by Account Type
    router.get('/:accountType', async (req, res) => {
        try {
            //Check that user is logged in
            if (!req.session.username) return res.status(401).json({ error: 'Not logged in' });

            //Get User ID
            const userId = await getUserId(req.session.username);

            //Get Account Type
            const { accountType } = req.params;

            //Validate Account Type
            const validTypes = ['checking', 'savings', 'other'];
            if (!validTypes.includes(accountType)) { return res.status(400).json({ error: 'Invalid account type' }); }

            //Get transaction history for account type
            const history = await transactions.find({ userId, accountType }).sort({ timestamp: -1 }).toArray();

            //Return transaction history
            res.json({ success: true, data: history });
        } catch (err) { res.status(500).json({ error: 'Failed to fetch account history' }); }
    });
    return router;
};
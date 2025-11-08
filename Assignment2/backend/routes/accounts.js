const express = require('express');

module.exports = (dbInstance) => {
    const router = express.Router();
    const accounts = dbInstance.getDb().collection('accounts');
    const transactions = dbInstance.getDb().collection('transactions');
    const categories = dbInstance.getDb().collection('categories');
    const users = dbInstance.getDb().collection('users');

    async function getUserId(username) {
        const user = await users.findOne({ username });
        return user?._id;
    }

    // Deposit into account
    router.post('/deposit', async (req, res) => {
        const { accountType, amount, category } = req.body;
        if (!req.session.username) return res.status(401).json({ error: 'Not logged in' });
        if (!accountType || !amount || !category) return res.status(400).json({ error: 'Missing fields' });

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const userId = await getUserId(req.session.username);
        const userAccount = await accounts.findOne({ userId });
        if (!userAccount) return res.status(404).json({ error: 'Account not found' });

        const index = userAccount.accounts.findIndex(acc => acc.type === accountType);
        if (index === -1) return res.status(400).json({ error: 'Invalid account type' });

        userAccount.accounts[index].balance += parsedAmount;
        await accounts.updateOne({ userId }, { $set: { accounts: userAccount.accounts } });

        await transactions.insertOne({
            userId,
            accountType,
            type: 'deposit',
            amount: parsedAmount,
            category,
            timestamp: new Date()
        });

        await categories.updateOne(
            { userId },
            { $addToSet: { categories: category } },
            { upsert: true }
        );

        res.json({ success: true, balance: userAccount.accounts[index].balance });
    });

    // Withdraw from account
    router.post('/withdraw', async (req, res) => {
        const { accountType, amount, category } = req.body;
        if (!req.session.username) return res.status(401).json({ error: 'Not logged in' });
        if (!accountType || !amount || !category) return res.status(400).json({ error: 'Missing fields' });

        const parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
            return res.status(400).json({ error: 'Invalid amount' });
        }

        const userId = await getUserId(req.session.username);
        const userAccount = await accounts.findOne({ userId });
        if (!userAccount) return res.status(404).json({ error: 'Account not found' });

        const index = userAccount.accounts.findIndex(acc => acc.type === accountType);
        if (index === -1) return res.status(400).json({ error: 'Invalid account type' });

        if (userAccount.accounts[index].balance < parsedAmount) {
            return res.status(400).json({ error: 'Insufficient funds' });
        }

        userAccount.accounts[index].balance -= parsedAmount;
        await accounts.updateOne({ userId }, { $set: { accounts: userAccount.accounts } });

        await transactions.insertOne({
            userId,
            accountType,
            type: 'withdraw',
            amount: parsedAmount,
            category,
            timestamp: new Date()
        });

        await categories.updateOne(
            { userId },
            { $addToSet: { categories: category } },
            { upsert: true }
        );
        res.json({ success: true, balance: userAccount.accounts[index].balance });
    });
    return router;
};
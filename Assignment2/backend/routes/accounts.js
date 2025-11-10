const express = require('express');

module.exports = (dbInstance) => {
    const router = express.Router();
    const accounts = dbInstance.getDb().collection('accounts');
    const transactions = dbInstance.getDb().collection('transactions');
    const categories = dbInstance.getDb().collection('categories');
    const users = dbInstance.getDb().collection('users');

    //Helpers functions: getUserId, getAccount
    async function getUserId(username) { return (await users.findOne({ username }))?._id; }

    async function getAccount(userId, type) {
        //Finds user
        const userAccount = await accounts.findOne({ userId });
        if (!userAccount) return null;

        //Finds account of user
        const index = userAccount.accounts.findIndex(acc => acc.type === type);
        if (index === -1) return null;
        return { userAccount, index };
    }

    //Deposit
    router.post('/deposit', async (req, res) => {
        try {
            const { accountType, amount, category } = req.body;

            //Null checks
            if (!req.session.username) return res.status(401).json({ error: 'Not logged in' });
            if (!accountType || !amount || !category) return res.status(400).json({ error: 'Missing fields' });

            //Parse and validate amount
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });

            //Get user ID and account
            const userId = await getUserId(req.session.username);
            const result = await getAccount(userId, accountType);
            if (!result) return res.status(400).json({ error: 'Invalid account type or user account not found' });

            //Update account balance
            const { userAccount, index } = result;
            userAccount.accounts[index].balance += parsedAmount;
            await accounts.updateOne({ userId }, { $set: { accounts: userAccount.accounts } });

            //Insert transaction record
            await transactions.insertOne({
                userId,
                accountType,
                type: 'deposit',
                amount: parsedAmount,
                category,
                timestamp: new Date()
            });

            //Add category
            await categories.updateOne(
                { userId },
                { $addToSet: { categories: category } },
                { upsert: true }
            );

            //Return balance
            res.json({ success: true, balance: userAccount.accounts[index].balance });
        } catch (err) { res.status(500).json({ error: 'Deposit failed' }); }
    });

    //Withdraw
    router.post('/withdraw', async (req, res) => {
        try {
            const { accountType, amount, category } = req.body;

            //Null checks
            if (!req.session.username) return res.status(401).json({ error: 'Not logged in' });
            if (!accountType || !amount || !category) return res.status(400).json({ error: 'Missing fields' });

            //Parse and validate amount
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });

            //Get user ID and account
            const userId = await getUserId(req.session.username);
            const result = await getAccount(userId, accountType);
            if (!result) return res.status(400).json({ error: 'Invalid UserID or Account Type' });

            //Check balance
            const { userAccount, index } = result;
            if (userAccount.accounts[index].balance < parsedAmount) return res.status(400).json({ error: 'Insufficient funds' });

            //Update account balance
            userAccount.accounts[index].balance -= parsedAmount;
            await accounts.updateOne({ userId }, { $set: { accounts: userAccount.accounts } });

            //Insert transaction record
            await transactions.insertOne({
                userId,
                accountType,
                type: 'withdraw',
                amount: parsedAmount,
                category,
                timestamp: new Date()
            });

            //Add category
            await categories.updateOne(
                { userId },
                { $addToSet: { categories: category } },
                { upsert: true }
            );

            //Return balance
            res.json({ success: true, balance: userAccount.accounts[index].balance });
        } catch (err) { res.status(500).json({ error: 'Withdraw failed' }); }
    });

    //Rename 'other' account
    router.post('/rename', async (req, res) => {
        const { accountType, newLabel } = req.body;
        const username = req.session.username;

        if (!username) return res.status(401).json({ error: 'Not logged in' });
        if (accountType !== 'other') return res.status(400).json({ error: 'Only "other" account can be renamed' });

        try {
            const userId = await getUserId(username);
            const result = await accounts.updateOne(
                { userId, 'accounts.type': 'other' },
                { $set: { 'accounts.$.label': newLabel } }
            );

            if (result.modifiedCount === 1) {
                res.json({ success: true });
            } else {
                res.status(400).json({ error: 'Rename failed' });
            }
        } catch (err) {
            console.error('Rename error:', err);
            res.status(500).json({ error: 'Server error' });
        }
    });
    return router;
};
const express = require('express');
const { ObjectId } = require('mongodb');

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

    router.post('/internal', async (req, res) => {
        try {
            const { fromType, toType, amount, category } = req.body;
            if (!req.session.username) return res.status(401).json({ error: 'Not logged in' });

            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                return res.status(400).json({ error: 'Invalid amount' });
            }

            const userId = await getUserId(req.session.username);
            const userAccount = await accounts.findOne({ userId });
            if (!userAccount) return res.status(404).json({ error: 'Account not found' });

            const fromIndex = userAccount.accounts.findIndex(acc => acc.type === fromType);
            const toIndex = userAccount.accounts.findIndex(acc => acc.type === toType);
            if (fromIndex === -1 || toIndex === -1) {
                return res.status(400).json({ error: 'Invalid account type' });
            }

            if (userAccount.accounts[fromIndex].balance < parsedAmount) {
                return res.status(400).json({ error: 'Insufficient funds' });
            }

            userAccount.accounts[fromIndex].balance -= parsedAmount;
            userAccount.accounts[toIndex].balance += parsedAmount;
            await accounts.updateOne({ userId }, { $set: { accounts: userAccount.accounts } });

            await transactions.insertOne({
                userId,
                accountType: fromType,
                type: 'transfer',
                amount: parsedAmount,
                category,
                timestamp: new Date(),
                details: { toUserId: userId, toAccountType: toType }
            });

            await categories.updateOne(
                { userId },
                { $addToSet: { categories: category } },
                { upsert: true }
            );

            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: 'Internal transfer failed' }); }
    });

    router.post('/external', async (req, res) => {
        try {
            const { fromType, toUserId, toAccountIndex, amount, category } = req.body;
            if (!req.session.username) return res.status(401).json({ error: 'Not logged in' });

            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                return res.status(400).json({ error: 'Invalid amount' });
            }

            const senderId = await getUserId(req.session.username);
            const senderAccount = await accounts.findOne({ userId: senderId });
            if (!senderAccount) return res.status(404).json({ error: 'Sender account not found' });

            let recipientObjectId;
            try {
                recipientObjectId = new ObjectId(toUserId);
            } catch { return res.status(400).json({ error: 'Invalid recipient ID' }); }

            const recipientAccount = await accounts.findOne({ userId: recipientObjectId });
            if (!recipientAccount) return res.status(404).json({ error: 'Recipient not found' });

            const fromIndex = senderAccount.accounts.findIndex(acc => acc.type === fromType);
            if (fromIndex === -1 || toAccountIndex < 0 || toAccountIndex > 2) {
                return res.status(400).json({ error: 'Invalid account type or index' });
            }

            if (senderAccount.accounts[fromIndex].balance < parsedAmount) {
                return res.status(400).json({ error: 'Insufficient funds' });
            }

            senderAccount.accounts[fromIndex].balance -= parsedAmount;
            recipientAccount.accounts[toAccountIndex].balance += parsedAmount;

            await accounts.updateOne({ userId: senderId }, { $set: { accounts: senderAccount.accounts } });
            await accounts.updateOne({ userId: recipientObjectId }, { $set: { accounts: recipientAccount.accounts } });

            await transactions.insertOne({
                userId: senderId,
                accountType: fromType,
                type: 'transfer',
                amount: parsedAmount,
                category,
                timestamp: new Date(),
                details: {
                    toUserId: recipientObjectId,
                    toAccountType: recipientAccount.accounts[toAccountIndex].type
                }
            });

            await categories.updateOne(
                { userId: senderId },
                { $addToSet: { categories: category } },
                { upsert: true }
            );

            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: 'External transfer failed' }); }
    });

    return router;
};
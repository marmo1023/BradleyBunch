const express = require('express');
const { ObjectId } = require('mongodb');

module.exports = (dbInstance) => {
    const router = express.Router();
    const accounts = dbInstance.getDb().collection('accounts');
    const transactions = dbInstance.getDb().collection('transactions');
    const categories = dbInstance.getDb().collection('categories');
    const users = dbInstance.getDb().collection('users');

    //Helper Functions: getUserId, getAccount
    async function getUserId(username) { return (await users.findOne({ username }))?._id; }
    async function getAccount(userId) { return await accounts.findOne({ userId }); }

    //Internal Transfer
    router.post('/internal', async (req, res) => {
        try {
            const { fromType, toType, amount, category } = req.body;
            
            //Check that user is logged in
            if (!req.session.username) return res.status(401).json({ error: 'Not logged in' });

            //Check amount validity
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ error: 'Invalid amount' });

            //Get userId and Account
            const userId = await getUserId(req.session.username);
            const userAccount = await getAccount(userId);
            if (!userAccount) return res.status(404).json({ error: 'Account not found' });

            //Find account indices
            const fromIndex = userAccount.accounts.findIndex(acc => acc.type === fromType);
            const toIndex = userAccount.accounts.findIndex(acc => acc.type === toType);
            if (fromIndex === -1 || toIndex === -1) return res.status(400).json({ error: 'Invalid account type' });

            //Check sufficient funds
            if (userAccount.accounts[fromIndex].balance < parsedAmount) return res.status(400).json({ error: 'Insufficient funds' });

            //Perform transfer
            userAccount.accounts[fromIndex].balance -= parsedAmount;
            userAccount.accounts[toIndex].balance += parsedAmount;
            await accounts.updateOne({ userId }, { $set: { accounts: userAccount.accounts } });

            //Add transaction record
            await transactions.insertOne({
                userId,
                accountType: fromType,
                type: 'transfer',
                amount: parsedAmount,
                category,
                timestamp: new Date(),
                details: { toUserId: userId, toAccountType: toType }
            });

            //Update categories
            await categories.updateOne(
                { userId },
                { $addToSet: { categories: category } },
                { upsert: true }
            );
            res.json({ success: true });
        } catch (err) { res.status(500).json({ error: 'Internal transfer failed' }); }
    });

    //External Transfer
    router.post('/external', async (req, res) => {
        try {
            const { fromType, toUserId, toAccountIndex, amount, category } = req.body;

            //Check that user is logged in
            if (!req.session.username) return res.status(401).json({ error: 'Not logged in' });

            //Check amount validity
            const parsedAmount = parseFloat(amount);
            if (isNaN(parsedAmount) || parsedAmount <= 0) {
                return res.status(400).json({ error: 'Invalid amount' });
            }

            //Get sender account info
            const senderId = await getUserId(req.session.username);
            const senderAccount = await getAccount(senderId);
            if (!senderAccount) return res.status(404).json({ error: 'Sender account not found' });

            //Get recipient account info
            let recipientObjectId;
            try { recipientObjectId = new ObjectId(toUserId); }
            catch { return res.status(400).json({ error: 'Invalid recipient ID' }); }
            const recipientAccount = await getAccount(recipientObjectId);
            if (!recipientAccount) return res.status(404).json({ error: 'Recipient not found' });

            //Find sender's from account index
            const fromIndex = senderAccount.accounts.findIndex(acc => acc.type === fromType);
            if (fromIndex === -1 || toAccountIndex < 0 || toAccountIndex > 2) return res.status(400).json({ error: 'Invalid account type or index' });

            //Check sufficient funds
            if (senderAccount.accounts[fromIndex].balance < parsedAmount) return res.status(400).json({ error: 'Insufficient funds' });

            //Perform transfer
            senderAccount.accounts[fromIndex].balance -= parsedAmount;
            recipientAccount.accounts[toAccountIndex].balance += parsedAmount;

            //Update accounts
            await accounts.updateOne({ userId: senderId }, { $set: { accounts: senderAccount.accounts } });
            await accounts.updateOne({ userId: recipientObjectId }, { $set: { accounts: recipientAccount.accounts } });

            //Add transaction record for sender
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

            //Update sender categories
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
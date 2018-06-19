require('dotenv').config();

const express = require('express')
const app = express()
const StellarSdk = require('stellar-sdk');
const { getSecondaryAddress, createSecondaryAccount } = require('./users')

const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const bodyParser = require('body-parser');
const secondSigner = {
    privateKey: process.env.SECOND_SIGNER_PRIVATE_KEY,
    publicKey: process.env.SECOND_SIGNER_PUBLIC_KEY
}


StellarSdk.Network.useTestNetwork();
app.use(bodyParser.json()); // support json encoded bodies

app.get('/second-signature/:address', async (req, res, next) => {
    try {
        const signature = await getSecondaryAddress(req.params.address)

        res.send(signature);
    } catch (err) {
        console.error(err)
        next(err)
    }
})

app.post('/secondary-account', async (req, res, next) => {
    try {
        const primaryAddress = req.body.primary_address

        const secondaryAddress = await createSecondaryAccount(primaryAddress)

        res.json({
            secondary_address: secondaryAddress
        });
        next()
    } catch (err) {
        console.error(err)
        next(err)
    }
})

app.post('/', async (req, res, next) => {
    try {
        const secondKeypair = StellarSdk.Keypair.fromSecret(secondSigner.privateKey)

        let transaction = req.body.transaction
        console.log(transaction)

        // Retrieve decoded transaction envelope
        transaction = StellarSdk.xdr.TransactionEnvelope.fromXDR(transaction, 'base64')

        // Create new transaction object
        transaction = new StellarSdk.Transaction(transaction)

        // Sign transaction
        transaction.sign(secondKeypair)

        // Submit transaction
        const result = await server.submitTransaction(transaction)

        console.log(result)
        res.send(result)
    } catch (err) {
        console.error(err)
        next(err)
    }
})

app.listen(3001, () => console.log('listening on port 3001...'))
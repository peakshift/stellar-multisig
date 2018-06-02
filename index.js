'use strict'

const axios = require('axios')
const StellarSdk = require('stellar-sdk');
const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const senderKeys = {
    privateKey: process.env.SENDER_PRIVATE_KEY,
    publicKey: process.env.SENDER_PUBLIC_KEY
}
const secondSigner = {
    privateKey: process.env.SECOND_SIGNER_PRIVATE_KEY,
    publicKey: process.env.SECOND_SIGNER_PUBLIC_KEY
}

StellarSdk.Network.useTestNetwork();


/**
 * Generate keypair
 *
 * @returns {object} keypair value
 */
const generateKeyPair = () => {
    const pair = StellarSdk.Keypair.random();

    // Return keypair
    return pair;
}

/**
 * Create an account
 *
 * @param {string}
 *
 * @return {Promise}
 */
const createAccount = async (publicKey) => {

    const response = await axios.get(`https://friendbot.stellar.org`, {
        qs: {addr: publicKey},
        json: true
    })

    return response
}

/**
 * Check account balance
 *
 * @param {string}
 *
 * @return {Promise}
 */
const getBalance = async (publicKey) => {

    return server.loadAccount(publicKey).then(function (account) {

        return account.balances
    });
}

/**
 * Send transaction
 *
 * @param {string}
 *
 * @return {Promise}
 */
const sendTransaction = async (receiverPublicKey) => {

    const sourceKeys = StellarSdk.Keypair.fromSecret(senderKeys.privateKey);
    const destinationId = receiverPublicKey;

    let transaction;

    // Verify destination account exists
    server.loadAccount(destinationId)

    // Account not found
        .catch(StellarSdk.NotFoundError, function (error) {
            throw new Error('The destination account does not exist!');
        })

        // Load account information
        .then(function () {
            return server.loadAccount(sourceKeys.publicKey());
        })

        .then(function (sourceAccount) {

            transaction = new StellarSdk.TransactionBuilder(sourceAccount)
                .addOperation(StellarSdk.Operation.payment({
                    destination: destinationId,
                    asset: StellarSdk.Asset.native(),
                    amount: "99.20"
                }))
                .build();

            // Sign
            transaction.sign(sourceKeys);

            // Send
            return server.submitTransaction(transaction);
        })
        .then(function (result) {
            return result;
        })
        .catch(function (error) {
            return error
        });
}

/**
 * Send options for multi-signature transactions
 *
 * @return {String}
 */
const setOptionsForMultiSignature = async () => {

    const senderAcc = await server.loadAccount(senderKeys.publicKey)
    const secondSignerAcc = await server.loadAccount(secondSigner.publicKey)

    console.log(senderAcc)
    console.log(secondSignerAcc)

    let transaction = new TransactionBuilder(senderAcc)
        .addOperation(Operation.setOptions({
            signer: {
                ed25519PublicKey: secondSigner.publicKey,
                weight: 1
            }
        }))
        .addOperation(Operation.setOptions({
            masterWeight: 1, // set master key weight
            lowThreshold: 1,
            medThreshold: 2, // a payment is medium threshold
            highThreshold: 2 // make sure to have enough weight to add up to the high threshold!
        }))
        .build()

    const rootKeypair = Keypair.fromSecret(senderKeys.privateKey)

    transaction.sign(rootKeypair) // only need to sign with the root signer as the 2nd signer won't be added to the account till after this transaction completes

    console.log(transaction.toEnvelope().toXDR('base64'))

    const result = await server.submitTransaction(transaction)

    console.log('Result:', result)

    return result
}

/**
 * Send multisignature transaction
 *
 * @param {object}
 *
 * @return {String}
 */
const sendMultiSignatureTransaction = async (receiverKeys) => {

    const senderAcc = await server.loadAccount(senderKeys.publicKey)
    const secondSignerAcc = await server.loadAccount(secondSigner.publicKey)
    const receiverAcc = await server.loadAccount(receiverKeys.publicKey)

    const rootKeypair = Keypair.fromSecret(senderKeys.privateKey)
    const secondKeypair = Keypair.fromSecret(secondSigner.privateKey)

    const transaction = new TransactionBuilder(senderAcc)
        .addOperation(Operation.payment({
            destination: receiverKeys.publicKey,
            asset: Asset.native(),
            amount: "100" // 1000 XLM
        }))
        .build()

    transaction.sign(rootKeypair)
    transaction.sign(secondKeypair)

    console.log(transaction.toEnvelope().toXDR('base64'))

    const result = await server.submitTransaction(transaction)

    console.log('Result:', result)

    return result
}

module.exports = {
    generateKeyPair,
    createAccount,
    getBalance,
    sendTransaction,
    setOptionsForMultiSignature,
    sendMultiSignatureTransaction
}
'use strict'
require('dotenv').config();

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
 * @return {Promise}
 */
const createAccount = async () => {

    try {
        const keyPair = generateKeyPair();
        const privateKey = keyPair.secret()
        const publicKey = keyPair.publicKey()

        const response = await axios.get(`https://friendbot.stellar.org`, {
            params: {
                addr: publicKey
            }
        })

        console.log(privateKey)
        console.log(publicKey)

        return response.data
    } catch (err) {
        console.error(err)
    }
}

/**
 * Check account balance
 *
 * @return {Promise}
 */
const getBalanceInfo = async () => {

    return server.loadAccount(senderKeys.publicKey).then(function (account) {

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

    try {
        const receiverAcc = await server.loadAccount(destinationId)
        const senderAcc = await server.loadAccount(sourceKeys.publicKey())

        transaction = new StellarSdk.TransactionBuilder(senderAcc)
            .addOperation(StellarSdk.Operation.payment({
                destination: receiverAcc.public,
                asset: StellarSdk.Asset.native(),
                amount: "99.20"
            }))
            .build();

        // Sign
        transaction.sign(sourceKeys);

        // Send
        return server.submitTransaction(transaction);

    } catch (err) {
        console.error(err)
    }
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

    let transaction = new StellarSdk.TransactionBuilder(senderAcc)
        .addOperation(StellarSdk.Operation.setOptions({
            signer: {
                ed25519PublicKey: secondSigner.publicKey,
                weight: 1
            }
        }))
        .addOperation(StellarSdk.Operation.setOptions({
            masterWeight: 1, // set master key weight
            lowThreshold: 1,
            medThreshold: 2, // a payment is medium threshold
            highThreshold: 2 // make sure to have enough weight to add up to the high threshold!
        }))
        .build()

    const rootKeypair = StellarSdk.Keypair.fromSecret(senderKeys.privateKey)

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
const sendMultiSignatureTransaction = async (receiverPublicKey) => {
    const senderAcc = await server.loadAccount(senderKeys.publicKey)
    const secondSignerAcc = await server.loadAccount(secondSigner.publicKey)
    const receiverAcc = await server.loadAccount(receiverPublicKey)

    const rootKeypair = StellarSdk.Keypair.fromSecret(senderKeys.privateKey)
    const secondKeypair = StellarSdk.Keypair.fromSecret(secondSigner.privateKey)

    const transaction = new StellarSdk.TransactionBuilder(senderAcc)
        .addOperation(StellarSdk.Operation.payment({
            destination: receiverPublicKey,
            asset: StellarSdk.Asset.native(),
            amount: "100" // 1000 XLM
        }))
        .build()

    // Sign transaction
    transaction.sign(rootKeypair)

    // Encode: transaction
    const encoded = transaction.toEnvelope().toXDR('base64')

    // Send
    return await axios.post(`http://localhost:3001`, {
        transaction: encoded
    })
}

module.exports = {
    generateKeyPair,
    createAccount,
    getBalanceInfo,
    sendTransaction,
    setOptionsForMultiSignature,
    sendMultiSignatureTransaction
}
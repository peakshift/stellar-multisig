'use strict'
require('dotenv').config();

const axios = require('axios')
const StellarSdk = require('stellar-sdk');
const { addUser } = require('./users')

const server = new StellarSdk.Server('https://horizon-testnet.stellar.org');
const envs = process.env

StellarSdk.Network.useTestNetwork();


/**
 * Initialize account
 *
 * @returns {Object}
 */
const initAccount = async () => {
    try {
        const primaryAddress = await createAccount('init')

        // Create secondary Account
        const response = await axios.post(`http://localhost:3001/secondary-account`, {
            primary_address: primaryAddress
        })

        const secondaryAddress = response.data.secondary_address

        // Add second signer address to the primary account to support multisignature transactions
        return setOptionsForMultiSignature(secondaryAddress)

    } catch (err) {
        console.error(err)
    }
}

/**
 * Generate keypair
 *
 * @returns {Object} keypair value
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
const createAccount = async (stage='') => {

    try {
        const keyPair = generateKeyPair();
        const privateKey = keyPair.secret()
        const publicKey = keyPair.publicKey()
        const response = await axios.get(`https://friendbot.stellar.org`, {
            params: {
                addr: publicKey
            }
        })

        if (stage === 'init') {
            envs['SENDER_PRIVATE_KEY'] = privateKey
            envs['SENDER_PUBLIC_KEY'] = publicKey

            console.log('************** Init Account Keys **************')
        }

        console.log('//---- Private Key ----//')
        console.log(privateKey)
        console.log('//---- Public Key ----//')
        console.log(publicKey)

        return publicKey
    } catch (err) {
        console.error(err)
    }
}

/**
 * Create receiver account to test payments
 *
 * @return {Promise}
 */
const createReceiverAccount = async () => {

    console.log('************** Receiver Account **************')

    const primaryAddress = await createAccount();

    // Create user with public address
    addUser({ primary_address: primaryAddress })
}

/**
 * Check account balance
 *
 * @return {Promise}
 */
const getBalanceInfo = async () => {

    return server.loadAccount(envs['SENDER_PUBLIC_KEY']).then(function (account) {

        return account.balances
    });
}

const getBalance = async () => {

    return await server.loadAccount(envs['SENDER_PUBLIC_KEY']).then(function (account) {
        console.log(account.balances)
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

    const sourceKeys = StellarSdk.Keypair.fromSecret(envs['SENDER_PRIVATE_KEY']);
    const destinationId = receiverPublicKey;

    let transaction;

    try {
        const receiverAcc = await server.loadAccount(destinationId)
        const senderAcc = await server.loadAccount(sourceKeys.publicKey())

        transaction = new StellarSdk.TransactionBuilder(senderAcc)
            .addOperation(StellarSdk.Operation.payment({
                destination: receiverAcc.public,
                asset: StellarSdk.Asset.native(),
                amount: "98"
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
 * @param {String} secondaryAddress - the second signer's public key
 *
 * @return {String}
 */
const setOptionsForMultiSignature = async (secondaryAddress) => {

    const senderAcc = await server.loadAccount(envs['SENDER_PUBLIC_KEY'])

    // Multi Sig Contract, tell stellar a second address needs to sign on this account
    let transaction = new StellarSdk.TransactionBuilder(senderAcc)
        .addOperation(StellarSdk.Operation.setOptions({
            signer: {
                ed25519PublicKey: secondaryAddress,
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

    const rootKeypair = StellarSdk.Keypair.fromSecret(envs['SENDER_PRIVATE_KEY'])

    transaction.sign(rootKeypair) // only need to sign with the root signer as the 2nd signer won't be added to the account till after this transaction completes

    console.log(transaction.toEnvelope().toXDR('base64'))

    const result = await server.submitTransaction(transaction)

    console.log('Result:', result)

    return result
}

/**
 * Send multisignature transaction
 *
 * @param {String} receiverPublicKey
 *
 * @return {String}
 */
const sendMultiSignatureTransaction = async (receiverPublicKey) => {
    const senderAcc = await server.loadAccount(envs['SENDER_PUBLIC_KEY'])
    const rootKeypair = StellarSdk.Keypair.fromSecret(envs['SENDER_PRIVATE_KEY'])

    const transaction = new StellarSdk.TransactionBuilder(senderAcc)
        .addOperation(StellarSdk.Operation.payment({
            destination: receiverPublicKey,
            asset: StellarSdk.Asset.native(),
            amount: '8' // XLM
        }))
        .build()

    // Sign transaction
    transaction.sign(rootKeypair)

    // Encode: transaction
    const encoded = transaction.toEnvelope().toXDR('base64')
    console.log(encoded)

    // Send transaction for second signature
    return await axios.post(`http://localhost:3001`, {
        transaction: encoded
    })
}

module.exports = {
    initAccount,
    generateKeyPair,
    createAccount,
    createReceiverAccount,
    getBalanceInfo,
    getBalance,
    sendTransaction,
    setOptionsForMultiSignature,
    sendMultiSignatureTransaction
}
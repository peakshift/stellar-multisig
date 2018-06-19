'use strict'
require('dotenv').config();

const StellarSdk = require('stellar-sdk')
const socket = require('socket.io-client')('http://localhost:4000')
const { addUser, updateUser, getUserByAddress } = require('./users')

const server = new StellarSdk.Server('https://horizon-testnet.stellar.org')
const receiverAddr = process.env.RECEIVER_ADDR

/**
 * Open stream to listen for received payments
 *
 * @returns null
 */
const openStream = async () => {
    // Query payments involving the account
    const payments = await server.payments().forAccount(receiverAddr)

    // Start from last handled payment
    const lastToken = await getLastPagingToken(receiverAddr)
    console.log('last token')
    console.log(lastToken)

    if (lastToken)
        payments.cursor(lastToken)

    // Open connection
    payments.stream({
        onmessage: function (payment) {

            // Record the paging token so we can start from here next time.
            savePagingToken(receiverAddr, payment.paging_token)

            // Only process received payments
            if (payment.to !== receiverAddr) {
                return;
            }

            // Send notification of received payment
            sendNotification({ address: receiverAddr, amount: payment.amount })

            // In Stellar’s API, Lumens are referred to as the “native” type.
            let asset = (payment.asset_type === 'native') ? 'lumens' : payment.asset_code + ':' + payment.asset_issuer

            console.log(payment.amount + ' ' + asset + ' from ' + payment.from + ' token: ' + payment.paging_token)
        },

        onerror: function (error) {
            console.error('Error in payment stream')
        }
    });
}

/**
 * Save payment token
 *
 * @param {String} address
 * @param {String} token
 *
 */
const savePagingToken = (address, token) => {
    const user = getUserByAddress(address)

    user ? updateUser(user.id, { token }) : addUser({ primary_address: address, token })
}


/**
 * Get token of last handled payment
 *
 * @param {String} address - stellar address of account receiving payment
 *
 * @return {String | Boolean}
 */
const getLastPagingToken = (address) => {

    const user = getUserByAddress(address)

    if (!user)
        return false

    return user.last_paging_token || false
}

/**
 * Send notification data
 *
 * @param {Object} data
 *
 */
const sendNotification = async (data) => {
    let message = 'A payment of ' + data.amount + 'has been received'

    socket.emit('payment_received', {
        user_address: data.address,
        message: message
    })
}

module.exports = {
    openStream
}
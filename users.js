'use strict'
const low = require('lowdb')
const FileSync = require('lowdb/adapters/FileSync')
const uuid = require('uuid/v1');
const { createAccount } = require('./index');

const adapter = new FileSync(`db/db.json`)
const db = low(adapter)

/**
 * Get user by id
 *
 * @param {String} id of user
 *
 * @return {String}
 */
const getUser = (id) => {

    return db.get('users')
        .find({ id: id })
        .value()
}

/**
 * Get user by address
 *
 * @param {String} address of user
 *
 * @return {String}
 */
const getUserByAddress = (address) => {

    return db.get('users')
        .find({ primary_address: address })
        .value()
}

/**
 * Create user
 *
 * @param {Object} data
 *
 */
const addUser = (data) => {
    const id = uuid()
    let formattedData = Object.assign({ id }, formatData(data))

    db.get('users')
      .push(formattedData)
      .write()
}

/**
 * Update user
 *
 * @param {String} id
 * @param {Object} data
 *
 */
const updateUser = (id, data) => {
    let formattedData = formatData(data)

    db.get('users')
        .find({ id: id })
        .assign(formattedData)
        .write()
}

/**
 * Adjust properties of data object
 *
 * @param {Object} data
 *
 * @return {Object}
 */
const formatData = (data) => {
    let obj = {}

    if (data.primary_address)
        obj.primary_address = data.primary_address
    if (data.secondary_address)
        obj.secondary_address = data.secondary_address
    if (data.token)
        obj.last_paging_token = data.token

    return obj
}

/**
 * Get secondary address for account
 *
 * @param {String} primaryAddress
 *
 * @return {String}
 */
const getSecondaryAddress = async (primaryAddress) => {
    const user = await getUser(address)

    return user.secondary_address
}

/**
 * Create secondary account for user
 *
 * @param {String} primaryAddress
 *
 * @return {String}
 */
const createSecondaryAccount = async (primaryAddress) => {
    try {
        console.log('************** Secondary Account Keys **************')
        // Create user with public key
        const secondaryAddress = await createAccount()

        // Save address pair
        addUser({
            primary_address: primaryAddress,
            secondary_address: secondaryAddress
        })

        return secondaryAddress
    } catch (err) {
        console.error(err)
        return false
    }
}

module.exports = {
    getUser,
    addUser,
    updateUser,
    getSecondaryAddress,
    getUserByAddress,
    createSecondaryAccount
}
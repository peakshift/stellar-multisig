1. `npm install`
2. `npm run server`
3. `npm run setup-accounts` to create three accounts. The first account for the sender, the second account to add as a second signer, and the third account to use for receiving payments. Multisignature is setup at this point
4. Create `.env` file and fill in the following environment variables from the account key pairs that were logged in the console:
   ```
    SENDER_PRIVATE_KEY 
    SENDER_PUBLIC_KEY
    SECOND_SIGNER_PRIVATE_KEY
    SECOND_SIGNER_PUBLIC_KEY
    RECEIVER_ADDR
   ```
5. `npm run notifications` to view incoming payments in the browser
6. `npm run stream-transactions` to monitor incoming payments for the receiving address
7. `npm run send-transaction` to send a transaction which is also signed by the second account
8. `npm run get-balance` to view current balance  
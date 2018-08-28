# Getting Started

Follow the steps below to clone and set up the project.

1. `git clone git@github.com:peakshift/stellar-multisig.git`
2. `cd stellar-multisig`
3. `npm install`
4. `npm run server`
5. `npm run setup-accounts` to create three accounts. The first account for the sender, the second account to add as a second signer, and the third account to use for receiving payments. Multisignature is setup at this point
6. Create `.env` file and fill in the following environment variables from the account key pairs that were logged in the console:
   ```
    SENDER_PRIVATE_KEY 
    SENDER_PUBLIC_KEY
    SECOND_SIGNER_PRIVATE_KEY
    SECOND_SIGNER_PUBLIC_KEY
    RECEIVER_ADDR
   ```
7. `npm run notifications` to view incoming payments in the browser
8. `npm run stream-transactions` to monitor incoming payments for the receiving address
9. `npm run send-transaction` to send a transaction which is also signed by the second account
10. `npm run get-balance` to view current balance  

# Contributing

### Branches
- A branch name should begin with the issue number, and have short name (2-4 words). New features or fixes should be based off of the `master` branch.
  - `git checkout -b 123-short-name master`

### Pushing Changes
1. Open Terminal.
2. `git pull`
3. `git add file_name.py`
4. `git commit -m "type(component): subject line"`
5. `git push origin 123-short-name `

### Commit Messages

*We follow the [Angular commit guidelines](https://github.com/angular/angular.js/blob/master/DEVELOPERS.md#-git-commit-guidelines) so that we can generate changelogs and have a clean commit history — see Pushing Changes #3 for an example commit.*

- Type, for your commit message commiting you should select a type from this list below:
  - feat: a new features
  - fix: a bug fix
  - docs: documentation only changes
  - style: changes that do not affect the menaing of the code (white-space, formatting, missing semi-colons, etc)
  - refactor: a code change that neither fixes a bug or adds a feature
  - pref: a code change that improves performance
  - test: adding missing tests
  - chore: changes to the build process or auxiliary tools and libraries such as documentation generation
- Components, represent the larger feature / scope of the change
- Subject line, use the imperative form of a verb
  - GOOD "add contributing guidelines"
  - BAD "adding contribuing guidelines"

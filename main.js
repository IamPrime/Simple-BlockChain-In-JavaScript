const {Blockchain, Transactions} = require('./blockchain');
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');

const myKey = ec.keyFromPrivate('66cfb67e0e62a5a515a2cdb9b78a86e0c0b56e95ceef91c89d34afd1f1abcfd6');
const myWalletAddress = myKey.getPublic('hex');

let primus = new Blockchain();

const Tx1 = new Transactions(myWalletAddress, 'public key goes here', 5);
Tx1.signTransaction(myKey);
primus.addTransaction(Tx1);


console.log('\n Starting the miner.....');
primus.minePendingTransactions(myWalletAddress);

console.log('\n Balance of Primus is ', primus.getBalanceofAddress(myWalletAddress));

console.log('Is Chain Valid? ', primus.isChainValid() ? 'Yes' : 'No');
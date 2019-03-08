const SHA256 = require("crypto-js/sha256");
const EC = require('elliptic').ec;
const ec = new EC('secp256k1');


class Transactions
{
    constructor(fromAddress, toAddress, amount)
    {
        this.fromAddress = fromAddress;
        this.toAddress = toAddress;
        this.amount = amount;
        this.timestamp = Date.now();
    }

    calculateHash()
    {
        return SHA256(this.fromAddress + this.toAddress + this.amount + this.timestamp).toString();
    }

    signTransaction(signingKey)
    {
        if(signingKey.getPublic('hex') !== this.fromAddress)
        {
            throw new Error(' You cannot sign transactions for other wallets! ');
        }

        const hashTx = this.calculateHash();
        const sig = signingKey.sign(hashTx, 'base64');
        this.signature = sig.toDER('hex');
    }

    isValid()
    {
        if(this.fromAddress === null) return true;

        if(!this.signature || this.signature.length === 0)
        {
            throw new Error('No Signature in this Transaction ');
        }

        const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
        return publicKey.verify(this.calculateHash(), this.signature);
    }
}

class Block
{
    constructor(timestamp, transactions, previousHash = '')
    {
        this.previousHash = previousHash;
        this.timestamp = timestamp;
        this.transactions = transactions;
        this.nonce = 0;
        this.hash = this.calculateHash();  
    }

    calculateHash()
    {
        return SHA256(this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce).toString();
    }

    mineBlock(difficulty)
    {
        while(this.hash.substring(0, difficulty) !== Array(difficulty + 1).join('0'))
        {
            this.nonce++;
            this.hash = this.calculateHash();
        }

        console.log("Block mined : " + this.hash);
    }

    hasValidTransactions()
    {
        for(const tx of this.transactions)
        {
            if(!tx.isValid())
            {
                return false;
            }
        }
        return true;
    }
}

class Blockchain
{
    constructor()
    {
        this.chain = [this.createGenesisBlock()];
        this.difficulty = 3;
        this.pendingTransactions = [];
        this.miningReward = 100;
    }

    createGenesisBlock()
    {
        return new Block(Date.parse('2019-02-13'), 'Primus Block', '0');
    }

    getLatestBlock()
    {
        return this.chain[this.chain.length - 1];
    }

    minePendingTransactions(miningRewardAddress)
    {
        let block = new Block(Date.now(), this.pendingTransactions);
        block.mineBlock(this.difficulty);

        console.log("Block is Successfully Mined! ");
        this.chain.push(block);

        this.pendingTransactions = 
        [
            new Transactions(null, miningRewardAddress, this.minePendingTransactions)
        ]
    }

    addTransaction(transactions)
    {
        if(!transactions.fromAddress || !transactions.toAddress)
        {
            throw new Error('Transactions Must Include from and to Address')
        }

        if(!transactions.isValid())
        {
            throw new Error('Cannot Add Invalid Transactions to Chain');
        }

        this.pendingTransactions.push(transactions);
    }

    getBalanceofAddress(address)
    {
        let balance = 0;

        for(const block of this.chain)
        {
            for(const trans of block.transactions)
            {
                if(trans.fromAddress === address)
                {
                    balance -= trans.amount;
                }

                if(trans.toAddress === address)
                {
                    balance += trans.amount;
                }
            }
        }

        return balance;
    }

    getAllTransactionsForWallet(address)
    {
        const txs = [];

        for(const block of this.chain)
        {
            for(const tx of block.transactions)
            {
                if(tx.fromAddress === address || tx.toAddress === address)
                {
                    txs.push(tx);
                }
            }
        }
        return txs;
    }

    isChainValid()
    {
        const iamPrime = JSON.stringify(this.createGenesisBlock());

        if(iamPrime !== JSON.stringify(this.chain[0]))
        {
            return false;
        }


        for(let i = 1; i < this.chain.length; i++)
        {
            const currentBlock = this.chain[i];
            const previousBlock = this.chain[i - 1];

            if(!currentBlock.hasValidTransactions())
            {
                return false;
            }

            if(currentBlock.hash !== currentBlock.calculateHash())
            {
                return false;
            }

            if(currentBlock.previousHash !== previousBlock.calculateHash())
            {
                return false;
            }
        }

        return true;
    }
}

module.exports.Blockchain = Blockchain;
module.exports.Transactions = Transactions;
module.exports.Block = Block;
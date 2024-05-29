const path = require('path');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => { 
    try {
        // Load the network configuration
        const ccpPath = path.resolve(__dirname, '..','..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
        let ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

        // Create a new file system-based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = await Wallets.newFileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get('appUser');
        if (!identity) {
            console.log('An identity for the user "appUser" does not exist in the wallet');
            console.log('Run the registerUser.js application before retrying');
            return res.status(400).json({ error: 'User identity not found' });
        }

        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'appUser', discovery: { enabled: true, asLocalhost: true } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        const contract = network.getContract('asctp');
        const purchase_id = req.body.purchase_id;

        if (!purchase_id) {
            return res.status(400).json({ error: 'purchase_id is required in the request body' });
        }

        let str =JSON.stringify(purchase_id)
        str=str.slice(1,str.length-1)
        str="PU_"+str
        const reply = await contract.evaluateTransaction('queryByID', str);
        const result=JSON.parse(reply.toString()) 
        if (result.length==0){
            return res.status(400).json({ error: 'Purchase '+str+'does not exist' });
        }
        else if(result[0].value.status!="CREATED"){
            return res.status(400).json({ error: 'Purchase '+str+' has been already received' });
        }



            const currentDate = new Date();
            const formattedDate = currentDate.toISOString().slice(0, 19) + 'Z';
    
            result[0].value.updated_at=formattedDate
            result[0].value.status="RECEIVED"
            await contract.submitTransaction('writeData', str, JSON.stringify(result[0].value));            
            console.log('Purchase updated')

        // Disconnect from the gateway.
        await gateway.disconnect();
        res.json({ message: 'Transaction submitted successfully' });

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).json({ error: 'Failed to submit transaction' });
    }
});

module.exports = router;
const path = require('path');
const { Gateway, Wallets } = require('fabric-network');
const fs = require('fs');
const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => { 
  try {
    // load the network configuration
    const ccpPath = path.resolve(__dirname, '..','..', '..', 'test-network', 'organizations', 'peerOrganizations', 'org1.example.com', 'connection-org1.json');
    const ccp = JSON.parse(fs.readFileSync(ccpPath, 'utf8'));

    // Create a new file system-based wallet for managing identities.
    const walletPath = path.join(process.cwd(), 'wallet');
    const wallet = await Wallets.newFileSystemWallet(walletPath);
    console.log(`Wallet path: ${walletPath}`);

    // Check to see if we've already enrolled the user.
    const identity = await wallet.get('admin');
    if (!identity) {
      console.log('An identity for the user "admin" does not exist in the wallet');
      console.log('Run the enrollAdmin.js application before retrying');
      return res.status(400).json({ error: 'User identity not found' });
    }

    // Create a new gateway for connecting to our peer node.
    const gateway = new Gateway();
    await gateway.connect(ccp, { wallet, identity: 'admin', discovery: { enabled: true, asLocalhost: true } });

    // Get the network (channel) our contract is deployed to.
    const network = await gateway.getNetwork('mychannel');

    // Get the contract from the network.
    const contract = network.getContract('asctp');

    // Evaluate the specified transaction with the provided purchase_id.
    const { v4: uuidv4 } = require('uuid');
    const employee_id = uuidv4();
    const value = req.body.value;

    if (!value) {
        return res.status(400).json({ error: 'Value is required in the request body' });
    }

    let str=JSON.stringify(employee_id)
    str=str.slice(1,str.length-1)
    str="EM_"+str

    const result1 = await contract.evaluateTransaction('queryByID', str);
    let check=result1.toString()
    if (check.length>2){
        return res.status(400).json({ error: 'employee '+str+' already exists' });
    }
    
    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().slice(0, 19) + 'Z';
    value.created_at=formattedDate;
    value.status="CREATED"

    await contract.submitTransaction('writeData', str, JSON.stringify(value));
    console.log('Transaction has been submitted');

    // Disconnect from the gateway.
    await gateway.disconnect();
    res.json({ message: 'Transaction submitted successfully', "id":employee_id});
  } 
  catch (error) {
    console.error(`Failed to evaluate transaction: ${error}`);
    res.status(500).json({ error: 'Failed to evaluate transaction' });
  }
});
module.exports = router;
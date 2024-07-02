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

    // Evaluate the specified transaction with the provided purchase_id.
    const { v4: uuidv4 } = require('uuid');
    const transport_id = uuidv4();
    const driver_id=req.body.driver_id
    const value = req.body.value;

    if (!transport_id || !value || !driver_id) {
        return res.status(400).json({ error: 'driver_id and Value are required in the request body' });
    }

    
    let str=JSON.stringify(transport_id)
    str=str.slice(1,str.length-1)
    str="TR_"+str
    

    let str10=JSON.stringify(driver_id)
    str10=str10.slice(1,str10.length-1)
    str10="DR_"+str10
    
    const reply10 = await contract.evaluateTransaction('queryByID', str10);
    const result10=JSON.parse(reply10.toString())
    console.log(result10[0])
    if (result10.length==0){
        return res.status(400).json({ error: 'Driver '+str10+' does not exist' });
    }
    else if("status" in result10[0].value && result10[0].value.status!="AVAILABLE"){
        return res.status(400).json({ error: 'Driver '+str+' is not available or is already travelling' });
    }            

    const currentDate = new Date();
    const formattedDate = currentDate.toISOString().slice(0, 19) + 'Z';
    value.created_at=formattedDate;
    value.driver_id=driver_id;

    result10[0].value.updated_at=formattedDate
    result10[0].value.status="ATTACHED"


    await contract.submitTransaction('writeData', str, JSON.stringify(value));
    console.log('Transport has been created');

    await contract.submitTransaction('writeData', str10, JSON.stringify(result10[0].value));
    console.log('Driver has been updated');

    const result = await contract.evaluateTransaction('queryAvailableZFB');

    // Disconnect from the gateway.
    await gateway.disconnect();
    res.json({ result:JSON.parse(result.toString()), "Transport ID": transport_id});
  } 
  catch (error) {
    console.error(`Failed to evaluate transaction: ${error}`);
    res.status(500).json({ error: 'Failed to evaluate transaction' });
  }
});
module.exports = router;
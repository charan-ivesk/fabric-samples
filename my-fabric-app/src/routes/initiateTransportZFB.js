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
        const transport_id = req.body.trs_id;
        const origin_facility_id=req.body.o_facility_id
        const destination_facility_id=req.body.d_facility_id


        if (!transport_id|| !destination_facility_id || !origin_facility_id) {
            return res.status(400).json({ error: 'Transport_id origin and destination are required in the request body' });
        }
        

        let str =JSON.stringify(transport_id)
        str=str.slice(1,str.length-1)
        str="TR_"+str
        const reply = await contract.evaluateTransaction('queryByID', str);
        const result=JSON.parse(reply.toString()) 
        if (result.length==0){
            return res.status(400).json({ error: 'Transport '+str+'does not exist' });
        }
        else if(result[0].value.status!="ATTACHED"){
            return res.status(400).json({ error: 'Transport '+str+' is empty' });
        }


        const currentDate = new Date();
        const formattedDate = currentDate.toISOString().slice(0, 19) + 'Z';

        result[0].value.updated_at=formattedDate
        result[0].value.status="INITIATED"
        result[0].value.source=origin_facility_id
        result[0].value.destination=destination_facility_id
        let facility_id=result[0].value.destination


        await contract.submitTransaction('writeData', str, JSON.stringify(result[0].value));

        
        console.log(' Transport updated')
        
        let ZFBlist = result[0].value.zeroFlyBag_ids
        for (var j=0;j<ZFBlist.length;j++){
            let str =JSON.stringify(ZFBlist[j])
            str=str.slice(1,str.length-1)
            str="ZF_"+str
            const reply = await contract.evaluateTransaction('queryByID', str);
            const result=JSON.parse(reply.toString()) 

            const currentDate = new Date();
            const formattedDate = currentDate.toISOString().slice(0, 19) + 'Z';
    
            result[0].value.updated_at=formattedDate
            result[0].value.status="INITIATED"
            result[0].value.nextDestination=facility_id

    
            await contract.submitTransaction('writeData', str, JSON.stringify(result[0].value));
            let num= (j+1).toString()
            
            console.log(num +' ZeroFlyBag Updated')
            }

        // Disconnect from the gateway.
        await gateway.disconnect();
        res.json({ message: 'Transaction submitted successfully' });

    } catch (error) {
        console.error(`Failed to submit transaction: ${error}`);
        res.status(500).json({ error: 'Failed to submit transaction' });
    }
});

module.exports = router;

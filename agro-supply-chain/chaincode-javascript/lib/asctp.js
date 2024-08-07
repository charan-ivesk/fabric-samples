/*
 * Copyright IBM Corp. All Rights Reserved.
 *
 * SPDX-License-Identifier: Apache-2.0
 */

'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');
const { create } = require('domain');
class ASCTP extends Contract {

    async initLedger(ctx){
        await ctx.stub.putState("test","hello world");
        return "success";
    }

    async writeData(ctx, key, value){
        await ctx.stub.putState(key,value);
        return value;
    }

    async readData(ctx, key){
        var response = await ctx.stub.getState(key);
        return response.toString();
    }    

    async queryByID(ctx, ID){
       let queryString ={}
       queryString.selector={"_id":ID}
       let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
       let result = await this.getIteratorData(iterator)
       return result
    }    

    async queryValidFB(ctx, g_id, f_id ){
        let queryString ={}
        queryString.selector={
            "_id": {
                "$regex": "FB_"
             },
            "produce_id":g_id,
            "facility_id":f_id,
            "status":"RECEIVED"
        }
        let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
        let result = await this.getIteratorData(iterator)
        return result
     } 


    async queryValidZFB(ctx){
        let queryString ={}
        queryString.selector={
            "_id": {
                "$regex": "ZF_"
             },
            "status":"UNUSED"
        }
        let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
        let result = await this.getIteratorData(iterator)
        return result
     }
    
    async queryAvailableZFB(ctx, facility_id){
        let queryString ={}
        queryString.selector={
            "_id": {
                "$regex": "ZF_"
             },
            "status":"BATCHED",
            "facility_id":facility_id
        }
        let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
        let result = await this.getIteratorData(iterator)
        return result
     }    

    async queryAvailableDrivers(ctx){
        let queryString ={}
        queryString.selector={
            "_id": {
                "$regex": "DR_"
             },
            "status":"AVAILABLE"
        }
        let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
        let result = await this.getIteratorData(iterator)
        return result
     }    

     async pendingPur(ctx){
        let queryString ={}
        queryString.selector={
            "_id": {
                "$regex": "PU_"
             },
            "status":"CREATED"
        }
        let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
        let result = await this.getIteratorData(iterator)
        return result
     }    


     async uniquePur(ctx, produce_id,supplier_id){
        let queryString ={}
        queryString.selector= {
            "_id": {
                "$regex": "PU_"
            },
            "created_at": {
                "$regex": `${formattedDate}.*`
            },
            "supplier_id": supplierId,
            "produce_id": produceId
        }

        let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
        let result = await this.getIteratorData(iterator)
        return result
     }  


     async pendingPurToday(ctx){
        const today = new Date();
        const yyyy = today.getUTCFullYear();
        const mm = String(today.getUTCMonth() + 1).padStart(2, '0'); // Months are zero-based
        const dd = String(today.getUTCDate()).padStart(2, '0');
        const todayStart = `${yyyy}-${mm}-${dd}T00:00:00Z`;
        const tomorrowStart = `${yyyy}-${mm}-${String(today.getUTCDate() + 1).padStart(2, '0')}T00:00:00Z`;
        let queryString ={}
        queryString.selector={
            "_id": {
                "$regex": "PU_"
             },
            "status":"CREATED",
            "created_at": {
                    "$gte": todayStart,
                    "$lt": tomorrowStart}
        }
        let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
        let result = await this.getIteratorData(iterator)
        return result
     }    

     async queryPendingTranport(ctx){
        let queryString ={}
        queryString.selector={
            "_id": {
                "$regex": "TR_"
             },
            "status":"INITIATED"
        }
        let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
        let result = await this.getIteratorData(iterator)
        return result
     }    


    async queryAllPurchases(ctx){
        let queryString ={}
        queryString.selector={      "_id": {
            "$regex": "PU_"
         }}
        let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
        let result = await this.getIteratorData(iterator)
  
        return result
     }    

     async queryAllSuppliers(ctx){
        let queryString ={}
        queryString.selector={      "_id": {
            "$regex": "SP_"
         }}
        let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
        let result = await this.getIteratorData(iterator)
  
        return result
     }    

     async queryAllQR(ctx){
        let queryString ={}
        queryString.selector={      "_id": {
            "$regex": "QR_"
         }}
        let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
        let result = await this.getIteratorData(iterator)
  
        return result
     }    

     async queryAllEmployees(ctx){
        let queryString ={}
        queryString.selector={      "_id": {
            "$regex": "EM_"
         }}
        let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
        let result = await this.getIteratorData(iterator)
  
        return result
     }    


     async queryAllZFB(ctx){
        let queryString ={}
        queryString.selector={      "_id": {
            "$regex": "ZF_"
         }}
        let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
        let result = await this.getIteratorData(iterator)
  
        return result
     }    

     async queryAllTransports(ctx){
        let queryString ={}
        queryString.selector={      "_id": {
            "$regex": "TR_"
         }}
        let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
        let result = await this.getIteratorData(iterator)
  
        return result
     }  

     async queryAllDrivers(ctx){
        let queryString ={}
        queryString.selector={      "_id": {
            "$regex": "DR_"
         }}
        let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
        let result = await this.getIteratorData(iterator)
  
        return result
     }    
 
    async queryAllFarmerBags(ctx){
        let queryString ={}
        queryString.selector={      "_id": {
            "$regex": "FB_"
            }}
        let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
        let result = await this.getIteratorData(iterator)

        return result
        }  

    async queryAllBatches(ctx){
        let queryString ={}
        queryString.selector={      "_id": {
            "$regex": "BA_"
            }}
        let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
        let result = await this.getIteratorData(iterator)

        return result
        }   

    async queryAllProduce(ctx){
        let queryString ={}
        queryString.selector={      "_id": {
            "$regex": "PD_"
            }}
        let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
        let result = await this.getIteratorData(iterator)

        return result
        }   

    async queryAllFacility(ctx){
        let queryString ={}
        queryString.selector={      "_id": {
            "$regex": "FA_"
            }}
        let iterator = await ctx.stub.getQueryResult(JSON.stringify(queryString))
        let result = await this.getIteratorData(iterator)

        return result
        }   

    
    async getIteratorData(iterator){
        let outputArray = []

        while(true){
            let res=await iterator.next();
            let jsonValue = {}
            if(res.value && res.value.value.toString('utf-8')){
                let str=res.value.key
                str=str.slice(3,str.length)
                jsonValue.id = str;
                jsonValue.value = JSON.parse(res.value.value.toString('utf-8'));
                outputArray.push(jsonValue)
            }
            
            if(res.done){
                await iterator.close();
                return outputArray;
            }
        }
    }

}

module.exports = ASCTP;
import { Meteor } from "meteor/meteor";
import { check, Match } from "meteor/check";
import { Reaction, Logger } from "/server/api";
import { Cart } from "/lib/collections";
import { ClientsTable } from "/imports/plugins/custom/beesknees/lib";
import { Restaurant } from ".";
import { RestaurantAPI } from "./restaurantapi";
import { PaymentMethod } from "/lib/collections/schemas";

let util = require("util");

const getErrorResult = function(error){
  Logger.warn(error);
  return result = {
    saved: false,
    error: error
  };
}

/*const getUserIdFromClientId = function(clientId){
  let userId = Meteor.users.findOne({
      clientId: parseInt(clientId)
    },
    { _id: 1}
  )._id;

  return userId;
}*/

/*const setClientPermissions = function(userId, perm){
  const shopId = ReactionCore.getShopId();
  Roles.addUsersToRoles(userId, perm, shopId);
}*/

/*
Restaurant.getClientId = function(userId){
  let clientId = Meteor.users.findOne({
      _id: userId
    },
    { clientId: 1}
  ).clientId;

  return clientId;
}
*/

/*const checkIfClientHasTable = function(clientId, status="open"){
  return ReactionCore.Collections.ClientsTable.findOne({
      status:status,
      $or:[{
        clients: {$in:[clientId]}
      },
      {
        masterClientNumber: clientId
      }]
    });
}*/

/*const doClientsTableInsert = function(collection, tableName, clientId, cartId, status, callback) {
  console.log("inside doClientsTableInsert tableName ", tableName, clientId, cartId, status);
  collection.rawCollection().findAndModify({
      status:status,
      tableNumber: tableName,
      $or:[{
        clients: {$in:[clientId]}
      },
      {
        masterClientNumber: clientId
      }]
    },
    []
    ,
    {
      $addToSet: {cartsId: cartId}
    }, callback
  );
}

const setTableMapOccupation = function(floor, tableName, clientId, state="danger"){
  ReactionCore.Collections.TableMap.update({
    "name": floor,
    "tables": {
        "$elemMatch": {"name": tableName}
    }
  },{
    "$set": {"tables.$.state": state, "tables.$.clientId": clientId}
  });
}*/

/*const insertOnClientsTable = function(creatorId, userId, cartId, clientId, tableName, status="open", shopId=ReactionCore.getShopId()){
  ReactionCore.Collections.ClientsTable.insert({
    creatorId: creatorId,
    userId: userId,
    cartsId:[cartId],
    shopId: shopId,
    clients:[],
    masterClientNumber: clientId,
    tableNumber: tableName,
    status: status
  });
}*/


Meteor.methods({
  /**
   * Submit a card for Authorization
   * @param  {Object} transactionType authorize or capture
   * @param  {Object} cardData card Details
   * @param  {Object} paymentData The details of the Payment Needed
   * @return {Object} results normalized
   */
  "restaurantSubmit": function (transactionType, cartData, paymentData) {
    check(transactionType, String);
    check(cartData,{
      clientId: Number,
      tableName: String
    });
    check(paymentData, {
      total: String,
      currency: String
    });
    let cartId;
    let userId;
    const shopId = Reaction.getShopId();
    //const sessionId = ReactionCore.sessionId;
    const cart = Cart.findOne({
      userId:this.userId,
      shopId: shopId,
    }
    );
    if(cart){
      cartId = cart._id;
    }else{
      //throw new Meteor.Error("Cart: cartId Error.", "No Cart found.");
      let error = "No Cart found.";
      return getErrorResult(error);
    }
    console.log("restaurantSubmit cartId ", cartId);
    //let clientId = parseInt(cartData.clientId);
    let clientId = cartData.clientId;
    let id;
    const tableParts = cartData.tableName.split(":");
    console.log("tableParts ", tableParts[0], tableParts[1]);
    if(Reaction.hasPermission(["employee/employee", "employee/master", "admin"])){
      //userId = Restaurant.getUserIdFromClientId(clientId);
      //console.log(`userId from clientId is: ${userId}`);
      if(clientId){
          //let obj = Meteor.wrapAsync(Restaurant.doClientsTableInsert)(ClientsTable, cartData.tableName, clientId, cartId, "opened");
          let obj = Restaurant.doClientsTableInsert(ClientsTable, cartData.tableName, clientId, cartId, "opened");
          console.log(`obj for clientId ${clientId} is ${util.inspect(obj)}`);
          if (obj === null || (obj.lastErrorObject && !obj.lastErrorObject.updatedExisting)){
              let data = {
                shopId: shopId,
                cartData: cartData,
                ownerUserId: this.userId,
                creatorCid: Meteor.user().clientId,
                masterName: Meteor.users.findOne({clientId: clientId}).username,
                cartId: cartId
              };
              try {
                id = Restaurant.openClientsTable(data);
              } catch(err){
                return getErrorResult(err);
              }
              /*try {
                userId = Restaurant.getUserIdFromClientId(clientId);
                Restaurant.setClientPermissions(userId, ["client/table"], shopId);
              } catch(err){
                let error = `There is no client with this number ${clientId}.`;
                console.log(error);
                return getErrorResult(error);
              };
              id = Restaurant.insertOnClientsTable(this.userId, userId, cartId, clientId, cartData.tableName);

              let tableParts = cartData.tableName.split(":");
              let floor = tableParts[0];
              let tableName = tableParts[1];

              Restaurant.setTableMapOccupation(floor, tableName, clientId);*/
          }
      }else{
        //throw new Meteor.Error("Employee: userId Error.", "Employee must provide a userId for the table.");
        let error = "Employee must provide a clientId for the table.";
        return getErrorResult(error);
      }

    }else if(Reaction.hasPermission(["client/vip"])){
      userId = this.userId;
      let clientId = Restaurant.getClientId(userId);
      //let obj = Meteor.wrapAsync(Restaurant.doClientsTableInsert)(ClientsTable, cartData.tableName, clientId, cartId, "opened");
      let obj = Restaurant.doClientsTableInsert(ClientsTable, cartData.tableName, clientId, cartId, "opened");
      if (obj === null){
          //check if client is already in any table. If it is, he can not open another table, just can have one table open.
          let clientdoc = Restaurant.checkIfClientHasTable(clientId);
          if (clientdoc === null){
              let data = {
                shopId: shopId,
                cartData: cartData,
                ownerUserId: this.userId,
                creatorCid: Meteor.user().clientId,//TODO: get employee from tableMap
                masterName: Meteor.user().username,
                clientUserId: this.userId,
                cartId: cartId
              };
              try {
                id = Restaurant.openClientsTable(data);
              } catch(err){
                return getErrorResult(err);
              }
              /*id = Restaurant.insertOnClientsTable(this.userId, this.userId, cartId, clientId, cartData.tableName);
              Restaurant.setClientPermissions(userId, ["client/table"], shopId);
              let tableParts = cartData.tableName.split(":");
              let floor = tableParts[0];
              let tableName = tableParts[1];
              Restaurant.setTableMapOccupation(floor, tableName);*/
          }else{
            let error = `Client already in table ${clientdoc.tableNumber}.`;
            return getErrorResult(error);
          }
      }
    }else if(Reaction.hasPermission(["client/table"]) && Reaction.hasPermission([`${tableParts[0]}/${tableParts[1]}`])){
      userId = this.userId;
      let clientId = Restaurant.getClientId(userId);
      console.log("before call wrapAsync clientId ", clientId);
      //let obj = Meteor.wrapAsync(Restaurant.doClientsTableInsert)(ClientsTable, cartData.tableName, clientId, cartId, "opened");
      let obj = Restaurant.doClientsTableInsert(ClientsTable, cartData.tableName, clientId, cartId, "opened");
      console.log("restaurantSubmit obj ", obj);
      if (obj === null){
        let error = `Not found table ${cartData.tableName} for client ${clientId}. Maybe table is not open yet. Please call the waiter.`;
        return getErrorResult(error);
      };
    }else{
      //throw new Meteor.Error(403, "Access Denied");
      let error = "Access Denied";
      return getErrorResult(error);
    }

    //verificar se a mesa está certa; se o utilizador é o válido e se quem submete tem autorização
    let total = parseFloat(paymentData.total);
    let result;
    try {
      let transaction = RestaurantAPI.methods.authorize.call({
        transactionType: transactionType,
        paymentData: paymentData
      });

      result = {
        saved: true,
        status: "created",
        currency: paymentData.currency,
        amount: total,
        transactionId: transaction.id,
        docInsertedId: id,
        response: {
          amount: total,
          transactionId: transaction.id,
          currency: paymentData.currency
        }
      };
    } catch (error) {
      return getErrorResult(error);
    }
    return result;
  },

  /**
   * Capture a Charge
   * @param {Object} paymentData Object containing data about the transaction to capture
   * @return {Object} results normalized
   */
  "restaurant/payment/capture": function (paymentData) {
    check(paymentData, PaymentMethod);
    let authorizationId = paymentData.transactionId;
    let amount = paymentData.amount;
    let response = RestaurantAPI.methods.capture.call({
      authorizationId: authorizationId,
      amount: amount
    });
    let result = {
      saved: true,
      response: response
    };
    return result;
  },

  /**
   * Create a refund
   * @param  {Object} paymentMethod object
   * @param  {Number} amount The amount to be refunded
   * @return {Object} result
   */
  "restaurant/refund/create": function (paymentMethod, amount) {
    check(paymentMethod, PaymentMethod);
    check(amount, Number);
    let { transactionId } = paymentMethod;
    let response = RestaurantAPI.methods.refund.call({
      transactionId: transactionId,
      amount: amount
    });
    let results = {
      saved: true,
      response: response
    };
    return results;
  },

  /**
   * List refunds
   * @param  {Object} paymentMethod Object containing the pertinant data
   * @return {Object} result
   */
  "restaurant/refund/list": function (paymentMethod) {
    check(paymentMethod, PaymentMethod);
    let { transactionId } = paymentMethod;
    let response = RestaurantAPI.methods.refunds.call({
      transactionId: transactionId
    });
    let result = [];
    for (let refund of response.refunds) {
      result.push(refund);
    }

    // The results retured from the RestaurantAPI just so happen to look like exactly what the dashboard
    // wants. The return package should ba an array of objects that look like this
    // {
    //   type: "refund",
    //   amount: Number,
    //   created: Number: Epoch Time,
    //   currency: String,
    //   raw: Object
    // }
    let emptyResult = [];
    return emptyResult;
  }
});

/*ValidCardNumber = Match.Where(function (x) {
  return /^[0-9]{14,16}$/.test(x);
});

ValidExpireMonth = Match.Where(function (x) {
  return /^[0-9]{1,2}$/.test(x);
});

ValidExpireYear = Match.Where(function (x) {
  return /^[0-9]{4}$/.test(x);
});

ValidCVV = Match.Where(function (x) {
  return /^[0-9]{3,4}$/.test(x);
});*/

/*
chargeObj = function () {
  return {
    amount: "",
    currency: "",
    card: {},
    capture: true
  };
};

parseCardData = function (data) {
  return {
    number: data.number,
    name: data.name,
    cvc: data.cvv2,
    expireMonth: data.expire_month,
    expireYear: data.expire_year
  };
};
*/

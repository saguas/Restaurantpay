import { Meteor } from "meteor/meteor";
import { Template } from "meteor/templating";
import { Session } from "meteor/session";
import { Reaction } from "/client/api";
import { Cart, Shops } from "/lib/collections";
import { ClientsTable } from "/imports/plugins/custom/beesknees/lib";
import { Restaurant } from "/imports/plugins/custom/reaction-restaurantpay/lib";

/* eslint camelcase: 0 */

let submitting = false;

beginSubmit = function (instance) {
  //this.template.$(":input").attr("disabled", true);
  instance.$("#btn-complete-order").text("Submitting ");
  return instance.$("#btn-processing").removeClass("hidden");
};
endSubmit = function (instance) {
  if (!submitting) {
    return uiEnd(instance, "Complete your order");
  }
};

uiEnd = function (template, buttonText) {
  template.$(":input").removeAttr("disabled");
  template.$("#btn-complete-order").text(buttonText);
  return template.$("#btn-processing").addClass("hidden");
};

paymentAlert = function (errorMessage) {
  return $(".alert").removeClass("hidden").text(errorMessage);
};

hidePaymentAlert = function () {
  return $(".alert").addClass("hidden").text("");
};

handleRestaurantSubmitError = function (error) {
  let serverError = error !== null ? error.message : void 0;
  if (serverError) {
    return paymentAlert("Oops! " + serverError);
  } else if (error) {
    return paymentAlert("Oops! " + error);
  }
};

/*const hasRestaurantFloor = function(){
  const tableMap = ReactionCore.Collections.TableMap.find();
  let countTables = tableMap.count();
  if(countTables > 1){
    return true;
  }
  return false;
}*/

Template.restaurantPaymentForm.onCreated(function(){
    this.floor = new ReactiveVar();
    this.clientId = new ReactiveVar();
    this.tableNumber = new ReactiveVar();

    this.autorun(() => {
      //clientId is needed to ignore guest users.
      let clientId = Meteor.user().clientId;
      if(clientId && Reaction.hasPermission(["client/table"]) && !Reaction.hasPermission(["employee/employee", "employee/master","admin", "owner"])){
        //this.subscribe("ClientsTable", clientId);
        //if (this.subscriptionsReady()) {
          let table = ClientsTable.findOne(
            {
                status:"opened",
                $or:[{
                  clients: {$in:[clientId]}
                },
                {
                  masterClientNumber: clientId
                }]
            }
          );
          if(table){
            let floor;
            let tableNumber;
            let tableNumberParts = table.tableNumber.split(":");
            if (tableNumberParts.length > 1){
              floor = tableNumberParts[0];
              tableNumber = tableNumberParts[1];
              Session.set("floor", floor);
            }else{
              tableNumber = tableNumberParts[0];
            }
            Session.set("tableNumber", tableNumber);
            Session.set("clientId", table.masterClientNumber);
          }
        //}
      }
    });
});


Template.restaurantPaymentForm.helpers({
  /*clientId: function(){
    return Session.get("clientId");
  }*/
  clientId() {
    let clientId = Session.get("clientId");
    return clientId;
  },
  clientOnly: function(){
    //const count = ClientsTable.find().count();
    if(!Reaction.hasPermission(["employee/employee", "employee/master", "admin"])){ //&& Reaction.hasPermission("client/table")){
      return true;
    }
    return false;
  },
  hasFloor: function(){
    /*if(!ReactionCore.hasPermission(["admin", "owner"]) && ReactionCore.hasPermission("client/table")){
      let table = ReactionCore.Collections.ClientsTable.findOne();
      if (table){
        return table.tableNumber.split(":").length > 1;
      }
      return false;
    }else{
      return Session.get("floor");
    }*/
    let hasfloor = Restaurant.hasRestaurantFloor();
    return hasfloor;
  },
  floor: function(table){
    if(Restaurant.hasRestaurantFloor() && !Reaction.hasPermission(["employee/employee", "employee/master", "admin", "owner"]) && Reaction.hasPermission("client/table")){
      let fl = table.split(":");
      if (fl.length > 1){
        return fl[0];
      }
      return "";
    }else if(Restaurant.hasRestaurantFloor()){
      return Session.get("floor");
    }else{
      return "";
    }
  },
  tableNumber: function(table){
    if(!Reaction.hasPermission(["employee/employee", "employee/master", "admin", "owner"]) && Reaction.hasPermission("client/table")){
      let fl = table.split(":");
      if (fl.length > 1){
        return fl[1];
      }
      return fl[0];
    }else{
      return Session.get("tableNumber");
    }
  },
  tables: function(){
    const clientId = Meteor.user().clientId;
    return ClientsTable.find({
        status:"opened",
        $or:[{
          clients: {$in:[clientId]}
        },
        {
          masterClientNumber: clientId
        }]
    })
  },
  hasTables: function(){
    if(!Reaction.hasPermission(["employee/employee", "employee/master", "admin", "owner"])){
      const clientId = Meteor.user().clientId;
      return ClientsTable.find({
          status:"opened",
          $or:[{
            clients: {$in:[clientId]}
          },
          {
            masterClientNumber: clientId
          }]
      }).count() > 0;
    }else{
      return true;
    }
  },
  closedTable: function(){
    const instance = Template.instance();
    if(!Reaction.hasPermission(["employee/employee", "employee/master", "admin"])){ //&& Reaction.hasPermission("client/table")){
      const clientId = Meteor.user().clientId;
      const count = ClientsTable.find({
          $or:[{
            clients: {$in:[clientId]}
          },
          {
            masterClientNumber: clientId
          }]
      }).count();
      if(count === 0){
        return true;
      }else{
        return false;
      }

    }

    //if (instance.subscriptionsReady()) {
    const tableName = Restaurant.getTableName(Session.get("floor"), Session.get("tableNumber"));
    const clientId = Session.get("clientId");
    const count = ClientsTable.find({
        status:{ $in:["closed", "payment"]},
        tableNumber: tableName,
        $or:[{
          clients: {$in:[clientId]}
        },
        {
          masterClientNumber: clientId
        }]
    }).count();
    console.log("count closeds ", count);
    return count >= 1;
    //}
    //return false;
  }
});

Template.restaurantPaymentForm.events({
//AutoForm.addHooks("restaurant-payment-form", {
  "click tr.clickable-row": function(event, instance){
    let data = event.currentTarget.dataset;
    let clientId = data.clientid;
    let floor = data.floor;
    let tableNumber = data.tablenumber;
    console.log("event table click ", event);
    instance.$("tr.clickable-row").removeClass("success");
    instance.$(event.currentTarget).addClass("success");
    instance.floor.set(floor);
    instance.tableNumber.set(tableNumber);
    instance.clientId.set(parseInt(clientId));
  },
  "submit": function (event, instance) {
    event.preventDefault();
    beginSubmit(instance);
    console.log("submitting restaurant-payment-form ", event);
    submitting = true;
    let template = instance;//this.template;
    let tableName;
    hidePaymentAlert();
    if(Session.get("floor")){
      tableName = (instance.floor.get() || Session.get("floor")).concat(":").concat((instance.tableNumber.get() || Session.get("tableNumber")));
    }else{
      tableName = instance.tableNumber.get() || Session.get("tableNumber");
    }
    let cartData = {
        clientId: instance.clientId.get() || parseInt(Session.get("clientId")),
        tableName: tableName
    }
    /*let cartData = {
      cartId: ReactionCore.Collections.Cart.findOne()._id,
    };*/
    //let storedCard = form.type.charAt(0).toUpperCase() + form.type.slice(1) + " " + doc.cardNumber.slice(-4);

    Meteor.RestaurantPayment.authorize({
      total: Cart.findOne().cartTotal(),
      currency: Shops.findOne().currency
    }, cartData, function (error, transaction) {
      let paymentMethod;
      submitting = false;
      if (error) {
        handleRestaurantSubmitError(error);
        uiEnd(template, "Resubmit payment");
      } else {
        if (transaction.saved === true) {
          paymentMethod = {
            processor: "Restaurant",
            method: "Restaurant Payment",
            transactionId: transaction.transactionId,
            currency: transaction.currency,
            amount: transaction.amount,
            status: transaction.status,
            mode: "authorize",
            createdAt: new Date(),
            transactions: []
          };
          paymentMethod.transactions.push(transaction.response);
          Meteor.call("cart/submitPayment", paymentMethod, function (error, result) {
            if(error){
              console.log("Error in call to cart/submitPayment ", error);
              //TODO: aqui remover a entrada no clientsTable
              return ;
            }
            if(!Reaction.hasPermission(["admin", "employee/employee", "employee/master"])){
              Restaurant.Messenger.sendTableNotification(tableName);
            }
          });

          //let clientsTableId = Restaurant.getClientsTableIdFromClientId(cartData.clientId);
          /*let clientsTableId = transaction.docInsertedId;
          console.log("setting clientsTableId ", clientsTableId);
          console.log("cartData.clientId ", cartData.clientId);
          Session.set("choosenUserId", clientsTableId);*/

        } else {
          handleRestaurantSubmitError(transaction.error);
          uiEnd(template, "Resubmit payment");
        }
      }
    });
    endSubmit(instance);
    return false;
  }
});

import { Meteor } from "meteor/meteor";
import { Packages } from "/lib/collections";

Meteor.RestaurantPayment = {
  accountOptions: function () {
    const settings = Packages.findOne({
      name: "reaction-restaurantpay"
    }).settings;
    if (!settings.apiKey) {
      throw new Meteor.Error("403", "Invalid Credentials");
    }
    return settings.apiKey;
  },

  authorize: function (paymentInfo, cartData, callback) {
    Meteor.call("restaurantSubmit", "authorize", cartData, paymentInfo, callback);
  }
};

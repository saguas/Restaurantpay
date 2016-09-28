import { Template } from "meteor/templating";
import { Packages } from "/lib/collections";
import { Reaction } from "/client/api";
/* eslint no-unused-vars: 0 */

Template.restaurantSettings.helpers({
  packageData: function () {
    return Packages.findOne({
      name: "reaction-restaurantpay"
    });
  }
});

Template.restaurant.helpers({
  packageData: function () {
    return Packages.findOne({
      name: "reaction-restaurantpay"
    });
  }
});

Template.restaurant.events({
  "click [data-event-action=showRestaurantSettings]": function () {
    Reaction.showActionView();
  }
});

AutoForm.hooks({
  "restaurant-update-form": {
    onSuccess: function (operation, result, template) {
      Alerts.removeSeen();
      return Alerts.add("Restaurant Payment Method settings saved.", "success");
    },
    onError: function (operation, error, template) {
      Alerts.removeSeen();
      return Alerts.add("Restaurant Payment Method settings update failed. " + error, "danger");
    }
  }
});

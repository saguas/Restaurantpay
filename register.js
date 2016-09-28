import { Reaction } from "/server/api";

/* eslint camelcase: 0 */

ReactionCore.registerPackage({
  label: "RestaurantPayment",
  name: "reaction-restaurantpay",
  icon: "fa fa-credit-card-alt",
  autoEnable: true,
  settings: {
    mode: false,
    apiKey: ""
  },
  registry: [
    // Dashboard card
    {
      provides: "dashboard",
      label: "Restaurant Payment Provider",
      description: "Restaurant payment provider",
      icon: "fa fa-credit-card-alt",
      priority: 3,
      container: "paymentMethod",
      template: "restaurant",
      permissions: [{
        label: "Restaurant Payment Provider",
        permission: "dashboard/restaurant"
      }]
    },

    // Settings panel
    {
      label: "Restaurant Payment Settings",
      route: "/dashboard/restaurant/settings",
      provides: "settings",
      container: "dashboard",
      template: "restaurantSettings"
    },

    // Payment form for checkout
    {
      template: "restaurantPaymentForm",
      provides: "paymentMethod"
    }
  ]
});

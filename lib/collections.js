import { SimpleSchema } from "meteor/aldeed:simple-schema";
import { PackageConfig } from "/lib/collections/schemas/registry";

export const PaymentMethodPackageConfig = new SimpleSchema([
  PackageConfig, {
    "settings.mode": {
      type: Boolean,
      defaultValue: true
    },
    "settings.apiKey": {
      type: String,
      label: "API Key",
      optional: false
    }
  }
]);

export const RestaurantPayment = new SimpleSchema({
  floor:{
    type:String,
    optional:true
  },
  tableName:{
    type:String
  },
  clientNumber:{
    type:String
  }
});

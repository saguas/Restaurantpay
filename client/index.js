import "./templates";
import { PaymentMethodPackageConfig } from "../lib";
import { RestaurantPayment } from "../lib";
import { Reaction } from "/client/api";


Object.assign(Reaction.Schemas, {RestaurantPayment: RestaurantPayment}, {PaymentMethodPackageConfig: PaymentMethodPackageConfig});

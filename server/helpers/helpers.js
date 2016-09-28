import { Restaurant as RestaurantServer } from "/imports/plugins/custom/beesknees/server";
import { Restaurant as RestaurantLib } from "../../lib";

const Restaurant = Object.assign({}, RestaurantServer, RestaurantLib);

export default Restaurant;

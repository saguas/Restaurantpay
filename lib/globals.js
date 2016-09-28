import { Restaurant as RestaurantLib } from "/imports/plugins/custom/beesknees/lib"

//if(!Restaurant) Restaurant = {};
//if(!Restaurant.pay) Restaurant.pay = {};

//Restaurant.pay = {};

const Restaurant = Object.assign({pay:{}}, RestaurantLib);

export default Restaurant;

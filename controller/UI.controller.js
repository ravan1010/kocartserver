import admin_model from '../model/admin_model.js';
import post_model from '../model/event_post_model.js';
import usermodel from '../model/user_model.js';
import book_model from '../model/cart_model.js';
import address_model from '../model/address_model.js';
import Cart from "../model/cart_model.js";
import order_model from '../model/order_model.js';
import nodemailer from "nodemailer";
import dotenv from 'dotenv';

dotenv.config();


export const home = async (req, res, next) => {

  try {
    const id = req.Atoken.id
    console.log('home')

    const user = await usermodel.findById(id)
    if (!id || !user) {
      return res.json('user not found')
    }
    const post = await post_model.find({ cityTown: user.city, status: 'home' })
    const city = user.city

    res.json({ post: post, city: city })

  } catch (error) {
    res.json(error)
  }
}

export const explore = async (req, res) => {
  try {
    console.log("explore");

    const id = req.Atoken.id;
    if (!id) {
      return res.status(401).json({ message: "Unauthorized user" });
    }

    const user = await usermodel.findById(id)
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // const cityTown = user.city;
    //  const products = await post_model.find({ cityTown: { $regex: cityTown, $options: 'i'}})
    // .select("name image variants variantname companyName active cityTown description")
    // .sort({ createdAt: -1 });

    const products = await post_model.find()


    return res.status(200).json(products);
  } catch (error) {
    console.error("Explore error:", error);
    return res.status(500).json({ message: "Server error" });
  }
};

export const nearby = async (req, res) => {

  try {
    const { lat, lng } = req.query;

    if (!lat || !lng) {
      return res.status(400).json({ message: "Location required" });
    }

    const merchants = await admin_model.find({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: 3000, // 3km in meters
        },
      },
    }).select("_id");

    const merchantIds = merchants.map(m => m._id);

    const grocery = await post_model.find({ author: { $in: merchantIds }, category: "groceryFruitsANDvegetables" });
    const restaurant = await post_model.find({ author: { $in: merchantIds }, category: "foodANDbeverages" });

    res.json({ grocery, restaurant });
  } catch (error) {
    res.status(500).json({ message: error.message });
    console.error("Nearby error:", error);
  }
};


export const address = async (req, res, next) => {

  const id = req.Atoken.id
  try {
    const user = await usermodel.findById(id)
    const address = await address_model.find({ authorID: user._id })
    res.json({ address: address })

  } catch (error) {
    res.json(error)
  }
}

const transporter = nodemailer.createTransport({

  service: 'gmail',
  port: 587,
  starttls: {
    enable: true
  },
  secureConnection: true,
  auth: {
    user: 'ravanten3@gmail.com',
    pass: process.env.emailpass
  }
});

export const setting = async (req, res, next) => {

  const id = req?.Atoken?.id

  try {

    const name = await usermodel.findById(id)
    if (!name) {
      return res.status(400).json('user not found')
    }

    res.json({ number: name.number } || null)
  } catch (error) {
    res.status(400).json(error)
  }
}

export const addtocart = async (req, res) => {
  try {
    const userId = req.Atoken.id;
    const { productId, adminId, quantity, variantid } = req.body;

    const product = await post_model.findById(productId);
    if (!product) {
      return res.status(400).json({ message: "product not exist" });
    }

    const variant = product.variants.find(
      v => v._id.toString() === variantid
    );
    if (!variant) {
      return res.status(400).json({ message: "variant not exist" });
    }

    const cartItemData = {
      productId,
      quantity,
      variantid,
      name: variant.name,
      variantName: product.variantname,
      price: variant.price
    };

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, shop: [], total: 0 });
    }



    // 🔹 find shop
    let shop = cart.shop.find(
      s => s.admin.toString() === adminId
    );

    // 🔹 if shop doesn't exist → create it
    if (!shop) {
      cart.shop.push({
        admin: adminId,
        items: [cartItemData],
        subtotal: cartItemData.price * cartItemData.quantity
      });

    } else {
      // 🔹 find item inside shop
      let item = shop.items.find(
        i =>
          i.productId.toString() === productId &&
          i.variantid.toString() === variantid
      );

      if (item) {
        item.quantity += quantity;
      } else {
        shop.items.push(cartItemData);
      }

      // recalc shop subtotal
      shop.subtotal = shop.items.reduce(
        (sum, i) => sum + i.price * i.quantity,
        0
      );
    }

    // 🔹 recalc cart total
    cart.total = cart.shop.reduce(
      (sum, s) => sum + s.subtotal,
      0
    );

    await cart.save();
    await cart.populate("shop.admin");

    res.json({ success: true, cart });

  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};



export const cartdata = async (req, res) => {

  const cart = await Cart.findOne({ userId: req.Atoken.id })
    .populate("shop.admin", "companyName")
    .populate("shop.items.productId", "image name")

  res.json(cart || null);
};

export const updateQuantity = async (req, res) => {
  const { productId, adminId, quantity } = req.body;

  const cart = await Cart.findOne({ userId: req.Atoken.id });

  const shop = cart.shop.find(s => s.admin.toString() === adminId);
  if (!shop) return res.json(cart);

  const item = shop.items.find(i => i.productId.toString() === productId);
  if (!item) return res.json(cart);

  item.quantity = quantity;

  shop.subtotal = shop.items.reduce((s, i) => s + i.price * i.quantity, 0);
  cart.total = cart.shop.reduce((s, sh) => s + sh.subtotal, 0);

  await cart.save();
  res.json(cart);
};



export const removecart = async (req, res) => {
  try {
    const userId = req.Atoken.id;
    const { shopId, itemId } = req.params;

    const user = await usermodel.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const cart = await Cart.findOne({ userId: user._id });
    if (!cart) {
      return res.status(404).json({ message: "Cart not found" });
    }

    // ✅ find shop (CORRECT)
    const shop = cart.shop.id(shopId);
    if (!shop) {
      return res.status(404).json({ message: "Shop not found in cart" });
    }

    // ✅ remove item from shop items
    const item = shop.items.id(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found" });
    }
    // ✅ Remove item first
    shop.items.pull(itemId);

    // 🧠 optional: remove shop if no items left
    if (shop.items.length === 0) {
      cart.shop.pull(shopId);
    }

    // ✅ recalculate total safely
    cart.total = (cart.shop || []).reduce((sum, shop) => {
      shop.subtotal = (shop.items || []).reduce((s, item) => {
        return s + item.price * item.quantity;
      }, 0);
      return sum + shop.subtotal;
    }, 0);

    if (cart.total < 0) cart.total = 0; // safety check

    // ✅ If cart is empty → delete document
    if (cart.total === 0) {
      await Cart.deleteOne({ _id: cart._id });

      return res.json({
        success: true,
        message: "Cart deleted (empty)",
      });
    }


    await cart.save();

    res.json({
      success: true,
      message: "Item removed from cart",
      cart,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



export const buy = async (req, res) => {

  try {
    const { Mobnumber, address } = req.body;

    console.log()

    const number = req.Atoken.number;
    const user = await usermodel.findOne({ number });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 1. Fetch the user's cart
    const cart = await Cart.findOne({ userId: user._id });
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({ message: "Cart is empty" });
    }
    // 2. Calculate total (adding 30 fee for each item, if that's what you mean)
    const totalAmount = cart.items.reduce((sum, item) => sum + item.price, 0) + 30;

    // 3. Create order
    const order = new order_model({
      userId: user._id,
      number: Mobnumber,
      address: address,
      items: cart.items,
      totalAmount
    });

    await order.save();

    const mailOptions = {
      from: "ravanten3@gmail.com",
      to: "suhasnayaj@gmail.com",
      subject: "Food order",
      html: `<h4> Food <h4> 
              <h1><strong>number : ${Mobnumber} </strong></h1>
              <h4> amount : ${totalAmount} </h4>
              <p>order id : ${order._id} </p>`
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error("Email error:", error);
      } else {
        console.log("Email sent: " + info.response);
      }
    });

    // 4. Delete the user's cart
    await Cart.deleteOne({ userId: user._id });

    res.json({ message: "Purchase successful" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }

}

export const order = async (req, res) => {

  const order = await order_model.find({ userId: req.Atoken.id })
    .populate("shop.admin", "companyName")
    .populate("shop.items.productId", "image name")
    .sort()

  res.json(order || null);
}




import axios from "axios";

const getRoadDistanceKm = async (from, to) => {
  const res = await axios.get(
    "https://api.geoapify.com/v1/routing",
    {
      params: {
        waypoints: `${from.lat},${from.lng}|${to.lat},${to.lng}`,
        mode: "drive",
        apiKey: '9101d57bd3a34d2194bb8222a55a6a3f',
      },
    }
  );

  return res.data.features[0].properties.distance / 1000; // meters → km
};


export const calculateDeliveryFee = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    console.log(latitude, longitude)
    const userId = req.Atoken.id;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Location required" });
    }

    // 📍 Save user location
    await usermodel.updateOne(
      { _id: userId },
      {
        location: {
          type: "Point",
          coordinates: [
            parseFloat(longitude),
            parseFloat(latitude),
          ],
        },
      }
    );

    const user = await usermodel.findById(userId);

    const cart = await Cart.findOne({ userId })
      .populate('shop.admin', 'location');

    if (!cart) {
      return res.json({ deliveryFee: 0, totalDistance: 0 });
    }

    // 🏪 Unique merchants
    const merchants = [];
    const seen = new Set();

    cart.shop.forEach((item) => {
      const merchant = item.admin;
      if (!seen.has(String(merchant._id))) {
        seen.add(String(merchant._id));
        merchants.push(merchant);
      }
    });

    let totalDistance = 0;

    console.log(merchants[0].location)

    // 📍 user → first merchant
    totalDistance += await getRoadDistanceKm(
      { lat: latitude, lng: longitude },
      {
        lat: merchants[0].location.coordinates[1],
        lng: merchants[0].location.coordinates[0],
      }
    );

    // 📍 merchant → merchant
    for (let i = 0; i < merchants.length - 1; i++) {
      totalDistance += await getRoadDistanceKm(
        {
          lat: merchants[i].location.coordinates[1],
          lng: merchants[i].location.coordinates[0],
        },
        {
          lat: merchants[i + 1].location.coordinates[1],
          lng: merchants[i + 1].location.coordinates[0],
        }
      );
    }

    // 💰 Fee logic
    let deliveryFee = 10;
    if (totalDistance > 1) {
      deliveryFee += Math.ceil(totalDistance - 1) * 10;
    }

    res.json({
      totalDistance: Number(totalDistance.toFixed(2)),
      deliveryFee,
      latitude,
      longitude,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delivery fee calculation failed" });
  }
};





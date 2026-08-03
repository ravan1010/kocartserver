import admin_model from '../model/admin_model.js';
import post_model from '../model/event_post_model.js';
import usermodel from '../model/user_model.js';
import book_model from '../model/cart_model.js';
import address_model from '../model/address_model.js';
import Cart from "../model/cart_model.js";
import order_model from '../model/order_model.js';
import nodemailer from "nodemailer";
import dotenv from 'dotenv';
import axios from "axios";
import branch_model from '../model/branch_model.js';
import parcelANDtransport from '../model/parcelANDtransport.js';
import BikeParcel_Order from '../model/BikeParcel_Order.js';
dotenv.config();


export const home = async (req, res) => {
  try {
    const id = req.Atoken.id;

    const user = await usermodel.findById(id).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if(!user.location){
      return res.status(404).json({
        success: false,
        message: "location not found",
      });
    }

    // Find nearby merchants within 7 km
    const nearbyAdmins = await admin_model.find({
      category: "foodANDbeverages",
      active: true,
      open: true,
      location: {
        $near: {
          $geometry: user.location,
          $maxDistance: 6000, // 6 km
        },
      },
    })
    .select("_id companyName")
    .lean();

    res.json({
      success: true,
      merchants: nearbyAdmins,
      // posts,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const mart = async (req, res) => {
  try {
    const id = req.Atoken.id;

    const user = await usermodel.findById(id).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if(!user.location){
      return res.status(404).json({
        success: false,
        message: "location not found",
      });
    }

    // Find nearby merchants within 7 km
    const nearbyAdmins = await admin_model.find({
      category: "groceryFruitsANDvegetables",
      active: true,
      open: true,
      location: {
        $near: {
          $geometry: user.location,
          $maxDistance: 3000, // 3 km
        },
      },
    })
    .select("_id companyName")
    .lean();

    // const adminIds = nearbyAdmins.map((admin) => admin._id);

    // // Get products/posts of nearby merchants
    // const posts = await post_model.find({
    //   author: { $in: adminIds },
    //   active: true,

    // }).lean();

    res.json({
      success: true,
      merchants: nearbyAdmins,
      // posts,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const updateLocation = async (req, res) => {
  try {
    const id = req.Atoken.id;

    const { latitude, longitude } = req.body;

    const user = await usermodel.findByIdAndUpdate(
      id,
      {
        location: {
          type: "Point",
          coordinates: [longitude, latitude],
        },
      },
      { new: true }
    );

    res.json({
      success: true,
      user,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const merchantProducts = async (req, res) => {

    try{

        const merchantId = req.params.id;

        const merchant = await admin_model
            .findById(merchantId)

        if(!merchant){
            return res.status(404).json({
                success:false, 
                message:"Merchant not found"
            });
        }


        const posts = await post_model.find({

            author: merchantId,
            active:true,
            open: true,

        }).lean();

          const branch = await branch_model.findOne({
      location: {
        $near: {
          $geometry: merchant.location,
          $maxDistance: 7000, // 7 km
        },
      },
    })

        res.json({

            success:true,
            merchant,
            posts,
            branch

        });

    }catch(err){

        res.status(500).json({
            success:false,
            message:err.message
        });

    }

}

export const getmartMerchantVariants = async (req, res) => {
  try {
    console.log("Merchant ID:", req.params.id);

    const variants = await post_model.distinct("variantname", {
      author: req.params.id,
      variantname: { $ne: "" },

    });

    console.log(variants);

    res.json({
      success: true,
      variants,
    });
  } catch (err) {
    console.log(err);
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const martmerchantProducts = async (req, res) => {
  try {
    const { id, variant } = req.query;

    const filter = {
      author: id,
      active: true,
      open: true,
    };

    if (variant) {
      filter.variantname = variant.trim();
    }

    const merchant = await admin_model.findById(id);

    if (!merchant) {
      return res.status(404).json({
        success: false,
        message: "Merchant not found",
      });
    }

    const posts = await post_model.find(filter).lean();

    const branch = await branch_model.findOne({
      location: {
        $near: {
          $geometry: merchant.location,
          $maxDistance: 7000,
        },
      },
    });

    res.json({
      success: true,
      merchant,
      posts,
      branch,
    });

  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
  
export const serviceType = async (req, res) => {
  try {

     const id = req.Atoken.id;

    const user = await usermodel.findById(id).lean();

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if(!user.location){
      return res.status(404).json({
        success: false,
        message: "location not found",
      });
    }


    const serviceTypes = await parcelANDtransport.distinct(
      "serviceType",
      {
        activate: true,
        isOnline: true,
        isAvailable: true,
        currentLocation: {
          $near: {
          $geometry: user.location,
          $maxDistance: 5000, // 3 km
        },
        },
      }
    );

    res.json({
      success: true,
      serviceTypes
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

export const createBikeParcelOrder = async (req, res) => {
  try {
    const {
      pickup,
      drop,
      parcel,
      payment,
      distance,
      amount,
    } = req.body;

    // Basic Validation
    if (!pickup || !drop) {
      return res.status(400).json({
        success: false,
        message: "Pickup and Drop are required.",
      });
    }

    if (
      pickup.location.coordinates.length !== 2 ||
      drop.location.coordinates.length !== 2
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates.",
      });
    }

    // Generate Order ID
    const orderId =
      "BP" +
      Date.now() +
      Math.floor(Math.random() * 1000);

      const pickupotp = Math.floor(1000 + Math.random() * 9000);
const dropotp = Math.floor(1000 + Math.random() * 9000);

const BikeParcel = await BikeParcel_Order.create({
  orderId,
  customer: req.Atoken.id,

  serviceType: "bike_parcel",
  distance,
  amount,

  pickup,
  drop,

  parcel,
  payment,

  otp: {
    pickup: pickupotp,
    delivery: dropotp,
  },

  status: "pending",
});


    res.status(201).json({
      success: true,
      message: "Order Created Successfully",
      BikeParcel,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message 
    })
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
      return res.status(400).json({
        success: false,
        message: "Latitude and Longitude are required",
      });
    }

    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        success: false,
        message: "Invalid coordinates",
      });
    }

    // Find nearby merchants (4 km)
    const merchants = await admin_model
      .find({
        location: {
          $near: {
            $geometry: {
              type: "Point",
              coordinates: [longitude, latitude],
            },
            $maxDistance: 3000,
          },
        },
      })
      .select("_id");

    const merchantIds = merchants.map((m) => m._id);

    // Find nearest branch (10 km)
    const branch = await branch_model.findOne({
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [longitude, latitude],
          },
          $maxDistance: 7000,
        },
      },
    });

    // If no merchants found
    if (merchantIds.length === 0) {
      return res.json({
        success: true,
        grocery: [],
        restaurant: [],
        branch,
      });
    }

    // Fetch posts in parallel
    const [grocery, restaurant] = await Promise.all([
      post_model.find({
        author: { $in: merchantIds },
        category: "groceryFruitsANDvegetables",
         open: true,
      active: true,
      }),
      post_model.find({
        author: { $in: merchantIds },
        category: "foodANDbeverages",
         open: true,
      active: true,
      }),
    ]);

    res.json({
      success: true,
      grocery,
      restaurant,
      branch,
    });
  } catch (error) {
    console.error("Nearby error:", error);

    res.status(500).json({
      success: false,
      message: error.message,
    });
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

export const setting = async (req, res) => {
  console.log(req.Atoken);

  const id = req.Atoken.id;
  console.log("User ID:", id);

  try {
    if (!id) {
      return res.status(401).json({
        message: "Unauthorized",
      });
    }

    const user = await usermodel.findById(id);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    res.json({
      number: user.email,
      user
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({
      message: error.message,
    });
  }
};

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

// Allow only one merchant in cart
if (
  cart.shop.length > 0 &&
  cart.shop[0].admin.toString() !== adminId
) {
  return res.status(400).json({
    success: false,
    differentMerchant: true,
    message:
      "Your cart contains items from another merchant. Clear the cart to continue.",
  });
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

export const clearCart = async (req, res) => {
  try {
    const userId = req.Atoken.id;

    await Cart.findOneAndUpdate(
      { userId },
      {
        shop: [],
        total: 0,
      }
    );

    res.json({
      success: true,
      message: "Cart cleared",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
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
    res.status(500).json({ message: "Server error", error });
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
    .populate("deliveryBoy","name")
    .sort({ createdAt: -1 })
    

  res.json(order || null);
}



const getRoadDistanceKm = async (from, to) => {
      const apiKey = process.env.GEOAPIFY_KEY;

  const res = await axios.get(
    "https://api.geoapify.com/v1/routing",
    {
      params: {
        waypoints: `${from.lat},${from.lng}|${to.lat},${to.lng}`,
        mode: "drive",
        apiKey: apiKey,
      },
    }
  );

  return res.data.features[0].properties.distance / 1000; // meters → km
};

export const calculateDeliveryFee = async (req, res) => {
  try {
    const { latitude, longitude } = req.body;
    const userId = req.Atoken.id;

    if (!latitude || !longitude) {
      return res.status(400).json({ message: "Location required" });
    }

    // Save user location
    // await usermodel.updateOne(
    //   { _id: userId },
    //   {
    //     location: {
    //       type: "Point",
    //       coordinates: [
    //         parseFloat(longitude),
    //         parseFloat(latitude),
    //       ],
    //     },
    //   }
    // );

    const cart = await Cart.findOne({ userId }).populate(
      "shop.admin",
      "location category"
    );

    if (!cart) {
      return res.json({
        deliveryFee: 0,
        totalDistance: 0,
      });
    }

    // Unique merchants
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

    // User → First Merchant
    totalDistance += await getRoadDistanceKm(
      {
        lat: parseFloat(latitude),
        lng: parseFloat(longitude),
      },
      {
        lat: merchants[0].location.coordinates[1],
        lng: merchants[0].location.coordinates[0],
      }
    );

    // Merchant → Merchant
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

    // Delivery fee
    let deliveryFee = 0;

    const category = merchants[0]?.category;

    if (category === "foodANDbeverages" || category === "FoodANDbeverages") {
      deliveryFee = 18;

  if (totalDistance > 1) {
    // Charge ₹10 for distance between 1 km and 3 km
    const distance1to3 = Math.min(totalDistance, 3) - 1;
    deliveryFee += Math.ceil(distance1to3) * 10;
  }

  if (totalDistance > 3) {
    // Charge ₹15 for every km after 3 km
    const distanceAfter3 = totalDistance - 3;
    deliveryFee += Math.ceil(distanceAfter3) * 17;
  }

    } else {
      deliveryFee = 31;
      if (totalDistance > 1) {
        deliveryFee += Math.ceil(totalDistance - 1) * 11;
      }
    }

    return res.json({
      totalDistance: Number(totalDistance.toFixed(2)),
      deliveryFee,
      latitude,
      longitude,
      category
    });
  } catch (err) {
    console.error(err);
    return res.status(500).json({
      message: "Delivery fee calculation failed",
    });
  }
};

export const distanceToParcel = async (req, res) => {
  try {
    const {pickuplat, pickuplng, droplat, droplng} = req.body;

    if(!pickuplat || !pickuplng || !droplat || !droplng){
      return res.status(404).json({massage: "fill require"})
    }

    const platform = 5;
        let deliveryFee = 18;


const distance = await getRoadDistanceKm(
  {
    lat: pickuplat,
    lng: pickuplng,
  },
  {
    lat: droplat,
    lng: droplng,
  }
)

 if (distance > 1) {
  const distance1to3 = Math.min(distance, 3) - 1;
  deliveryFee += Math.ceil(distance1to3) * 10;
}

if (distance > 3) {
  const distanceAfter3 = distance - 3;
  deliveryFee += Math.ceil(distanceAfter3) * 17;
}

  return res.json({
      distance: Number(distance.toFixed(2)),
      amount : deliveryFee,
      platform
    });

  } catch (error) {
    res.status(500).json(error)
  }
}
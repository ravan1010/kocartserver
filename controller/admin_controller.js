import adminmodel from '../model/admin_model.js';
import adminotpmodel from '../model/admin_otp.js';
import post_model from '../model/event_post_model.js';
import bookmodel from '../model/cart_model.js';
import otpGenerate from 'otp-generator';
import jwt from 'jsonwebtoken';
import usermodel from '../model/user_model.js';
import dotenv from 'dotenv'
import order_model from '../model/order_model.js';
import branch_model from '../model/branch_model.js';
import { sendPushNotification } from '../utils/firebase.js';
import deliveryBoy_model from '../model/deliveryBoy_model.js';


dotenv.config();

export const admininfo = async (req, res) => {
  try {
    const id = req.admingu.id;

    console.log("Admin ID:", id);

    const {
      companyName,
      category,
      FHBCA,
      ASSV,
      Landmark,
      pincode,
      cityTown,
      state,
      latitude,
      longitude,
      city,
    } = req.body;

    if (!latitude || !longitude) {
      return res.status(400).json({
        success: false,
        message: "Latitude and longitude required",
      });
    }

    const admininfo = await adminmodel.findByIdAndUpdate(
      id,
      {
        companyName,
        category,
        city,
        address: {
          FHBCA,
          ASSV,
          Landmark,
          pincode,
          cityTown,
          state,
        },
        location: {
          type: "Point",
          coordinates: [
            parseFloat(longitude), // lng first
            parseFloat(latitude),  // lat second
          ],
        },
      },
      {
        new: true,          // return updated document
        runValidators: true,
      }
    );

    if (!admininfo) {
      return res.status(404).json({
        success: false,
        message: "Admin not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Updated successfully",
      data: admininfo,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export const Adminid = async (req, res) => {
  try {
    console.log("admingu:", req.admingu);

    if (!req.admingu) {
      return res.status(401).json({
        message: "Unauthorized"
      });
    }

    const author = await adminmodel.findById(req.admingu.id);

    if (!author) {
      return res.status(404).json({
        message: `Admin not found ${author} || ${req.admingu}`
      });
    }

    res.json({
      id: author._id
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: err.message
    });
  }
};

export const AdminFCMtoken = async (req, res) => {
  try {
    const number = req.admingu.id
    const { fcmToken } = req.body;
    console.log('number :', number)

    if (!fcmToken) {
      return res.status(400).json({ success: false });

    }

    await adminmodel.updateMany({ _id: number }, {
      fcmToken: fcmToken
    });

  } catch (error) {
    res.status(500).json(error)
  }
}

//posts
export const EVENTCreate = async (req, res, next) => {

  try {

    const number = req.admingu.id
    const adminuser = await adminmodel.findById(number)

    console.log('Eventcategory')
    const { name,
      description,
      image,
      variants,
      variantname,
    } = req.body

    const cityTown = adminuser.city
    const companyName = adminuser.companyName

    console.log(cityTown)

    if (!image) {
      return res.status(404).json({ message: "select images" })
    }


    const postData = await post_model.create({
      author: adminuser._id,
      name: name,
      description: description,
      image: image,
      cityTown: cityTown,
      companyName: companyName,
      variantname: variantname,
      variants: variants,
      open: adminuser.open
    })
    await postData.save()

    if (postData) {
      adminuser.posts.push(postData._id);
      await adminuser.save();
    }

    res.status(201).json({ message: `post created`, id: `${postData._id}`, success: true })

  } catch (error) {
    res.json(error)
  }

}

export const dashboard = async (req, res, next) => {
  try {
    const id = req.admingu.id
    const author = await adminmodel.findById(id)
    const post = await post_model.find({ author: author._id })
    res.status(201).json({
      post: post,
      productlist: post.length,
      openORclose: author.open,
      id: author._id,
      marchent: author,
    })

  } catch (error) {
    res.json(error)
  }
}

export const EVENTDelete = async (req, res, next) => {

  const number = req.admingu.id
  const adminuser = await adminmodel.findById(number)
  const id = req.params.id
  try {
    const product = await post_model.findById(id);
    console.log(product)
    if (!product) {
      return res.status(404).json({ message: "product not found" });
    }

    if (adminuser) {
      adminuser.posts.pull(id);
      await adminuser.save();
    }

    const deletedProduct = await post_model.findByIdAndDelete(id);
    if (!deletedProduct) return res.status(404).json({ message: 'Product not found' });
    res.json({ message: 'Product deleted successfully' });

  } catch (error) {
    res.status(500).json({ message: "server error", error: error.message })
  }

}

///getallAdminpost for dashboard

export const getallAdminpost = async (req, res, next) => {
  console.log("suhas")

  try {
    const id = req.admingu.id

    const author = await adminmodel.findById(id)

    const post = await post_model.find({ author: author._id })
    res.json(post)

  } catch (error) {
    res.json({ error: error.message })
  }
}

export const Toadmin = async (req, res, next) => {

  try {
    const number = req.admingu.id
    const admin = await adminmodel.findById(number)

    if (!admin) {
      return res.json({ success: false })
    }

    res.json({ success: true })
  } catch (error) {
    res.json(error)
  }
}

export const bookedlisttoadmin = async (req, res) => {
  const number = req.admingu.id

  try {

    const admin = await adminmodel.findById(number)
    const adminpost = admin.posts

    const bookedlist = await order_model.find({ items: adminpost })
    const postlist = await post_model.find({ _id: adminpost })

    res.json({ bookedlist: bookedlist, postlist: postlist })

  } catch (error) {
    res.json(error)
  }
}

export const openORclose = async (req, res) => {
  try {
    const number = req.admingu.id
    console.log(number, req.body)
    const admin = await adminmodel.findById(number)
    const post = await post_model.findOne({ author: admin._id })

    admin.open = !admin.open;
    await admin.save();
    console.log(admin._id)

      await post_model.updateMany(
        { author: admin._id },
        { active: admin.open }
      );
    
    res.json({ success: true })

  } catch (error) {
    res.json({ message: error })
  }
}

export const open = async (req, res) => {
  try {
    const { id } = req.params;
    const { open } = req.body;
    const number = req.admingu.id


    const admin = await adminmodel.findById(number)
    // const post = await post_model.findOne({ author: admin._id })

    if (admin.open === false) {
      return res.status(400).json({ message: 'store door off' })
    }

    const post = await post_model.findById(id);
    console.log(id, open, post)

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.active = open;
    await post.save();

    res.status(200).json({
      success: true,
      open: post.open,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


export const EVENTUpdate = async (req, res, next) => {
  try {
    const adminNumber = req.admingu.id
    const adminuser = await adminmodel.findById(adminNumber);
    console.log('update')

    if (!adminuser) {
      return res.status(401).json({ success: false, message: "Admin not found" });
    }

    const { id } = req.params; // event/post id

    const {
      name,
      description,
      image,
      variants,
      variantname,
      open,
    } = req.body;

    // find post
    const post = await post_model.findById(id);

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // 🔐 ownership check
    if (post.author.toString() !== adminuser._id.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    // 🧠 update only provided fields
    if (name !== undefined) post.name = name;
    if (description !== undefined) post.description = description;
    if (image !== undefined) post.image = image;
    if (variants !== undefined) post.variants = variants;
    if (variantname !== undefined) post.variantname = variantname;
    if (open !== undefined) post.open = open;

    // optional sync from admin profile
    post.cityTown = adminuser.city;
    post.companyName = adminuser.companyName;
    post.category = adminuser.category;

    await post.save();

    res.status(200).json({
      success: true,
      message: "Post updated successfully",
      id: post._id,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};


export const getSinglePost = async (req, res) => {
  try {
    const adminNumber = req.admingu.id

    const adminuser = await adminmodel.findById(adminNumber);
    if (!adminuser) {
      return res.status(401).json({ message: "Admin not found" });
    }

    const { id } = req.params;

    const post = await post_model.findById(id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // 🔐 Ensure admin owns this post
    if (post.author.toString() !== adminuser._id.toString()) {
      return res.status(403).json({ message: "Unauthorized access" });
    }



    res.status(200).json(post);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getAdminOrders = async (req, res) => {
  try {
    const adminNumber = req.admingu.id
    const adminuser = await adminmodel.findById(adminNumber);

    if (!adminuser) {
      return res.status(401).json({ message: "Admin not found" });
    }

    const orders = await order_model.find({ "shop.admin": adminuser._id })
      .populate("userId", "name email")
      .populate("shop.items.productId", "name image price")
      .populate("shop.items.variantid", "name")
      .populate("address", "FHBCA ASSV Landmark pincode cityTown state")
      .populate("deliveryBoy", "name")

    res.status(200).json({ success: true, 
                           orders, 
                           pendingOrders: orders.filter(order => order.status === "pending"),
                           acceptedOrders: orders.filter(order => order.status === "accepted"),
                           assignedOrders: orders.filter(order => order.status === "assigned"),
                           completedOrders: orders.filter(order => order.status === "delivered"),
                           cancelledOrders: orders.filter(order => order.status === "cancelled"),
                          });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const updateOrder = async (req, res) => {
  try {
    const adminNumber = req.admingu.id;
    const adminuser = await adminmodel.findById(adminNumber);
    const { orderId, orderstatus } = req.params; 

    console.log(orderId, orderstatus)

    if (!adminuser) {
      return res.status(401).json({ message: "Admin not found" });
    }

    const order = await order_model.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Update order
    order.status = orderstatus;
    await order.save();

    // When accepted, start searching for delivery boy
    if (orderstatus === "accepted") {
      const notifyDrivers = async () => {
        let attempts = 0;

        const interval = setInterval(async () => {
          attempts++;

          // Check if already assigned
          const latestOrder = await order_model.findById(orderId);

          if (!latestOrder || latestOrder.deliveryBoy) {
            clearInterval(interval);
            return;
          }

          const nearbyBoys = await deliveryBoy_model.find({
            isOnline: true,
            isAvailable: true,
            currentLocation: {
              $near: {
                $geometry: {
                  type: "Point",
                  coordinates: latestOrder.location.coordinates,
                },
                $maxDistance: 5000,
              },
            },
          });

          for (const boy of nearbyBoys) {
            if (boy.fcmToken) {
              await sendPushNotification(
                boy.fcmToken,
                "🚚 New Delivery Available",
                `Order #${latestOrder._id}`,
                `/delivery/order/${latestOrder._id}`
              );
            }
          }

          console.log(
            `Notification round ${attempts} sent to ${nearbyBoys.length} drivers`
          );

          // Stop after 1 minute
          if (attempts >= 6) {
            clearInterval(interval);
          }
        }, 50000); // every 50 sec
      };

      notifyDrivers();
    }

    res.status(200).json({
      success: true,
      order,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error",
    });
  }
};
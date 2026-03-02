import admin from "firebase-admin";
import dotenv from "dotenv";

dotenv.config();
// import fs from "fs";

// const serviceAccount = JSON.parse(
//   fs.readFileSync("./utils/serviceAccountKey.json", "utf8")
// );

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

console.log("PROJECT:", process.env.FIREBASE_PROJECT_ID);
console.log("EMAIL:", process.env.FIREBASE_CLIENT_EMAIL);
console.log("KEY START:", process.env.FIREBASE_PRIVATE_KEY?.length);

admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
    }),
  });





export const sendPushNotification = async (fcmToken, title, body, url) => {

  if (typeof fcmToken !== "string") {
    console.log("⚠️ FCM token missing, push skipped");
    return;
  }

 const massage = {
  token: fcmToken,
  notification: {
    title,
    body,
  },
  webpush: {
    fcmOptions: {
    link: url,
  },
  },
}; 

  try {
    const res = await admin.messaging().send(massage);
    return res;
  } catch (error) {
    // throw error;
    console.error("❌ FCM Error:", error);
  }
};

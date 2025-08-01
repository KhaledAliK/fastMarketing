// const admin = require("../config/firebaseAdmin");

// const deviceToken = "e2p-YBEsRPG10qH7o0ZXrB:APA91bECh7YQ-u-RQ2NWzTmKI3KmLrPmJHOdDOfqBh72PL1tF15XXUmUb8nHzrcO9MrlXfdaW5E9698rGGPAwQCzVPwZUzaenO9P7wROH5awPpF2peubhC8";

// const message = {
//   notification: {
//     title: "Test notification",
//     body: "Hello! This is a test notification.",
//   },
//   token: deviceToken,
// };

// admin
//   .messaging()
//   .send(message)
//   .then((response) => {
//     console.log("✅ Successfully sent message:", response);
//   })
//   .catch((error) => {
//     console.error("❌ Error sending message:", error);
//   });

const admin = require("../config/firebaseAdmin");

const sendNotification = async(title, body, topic) => {
    const message = {
        notification: {
            title: title,
            body: body,
        },
        topic: topic
    }

    try {
        const response = await admin.messaging().send(message);
        console.log("✅ Successfully sent message:", response);
    } catch (error) {
        console.error("❌ Error sending message:", error);
    }
}

sendNotification("Special Offer!", "Enjoy a special discount on your next purchase.", "user_subscribed");

sendNotification("Reminder!", "Don't forget to complete your subscription.", "user_not_subscribed");

sendNotification("Welcome!", "Hello and welcome to our platform!", "all_users");

  
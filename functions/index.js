const functions = require('firebase-functions');
const admin = require('firebase-admin');
admin.initializeApp();

// add admin role
exports.addAdminRole = functions.https.onCall((data, context) => {
    // check request is made by an admin
    if (context.auth.token.admin !== true) {
        return { error: 'only, admins can add other admins, sucker!' }
    }

    // get user and add custom claim (admin)
    return admin.auth().getUserByEmail(data.email).then(user => {
        return admin.auth().setCustomUserClaims(user.uid, {
            admin: true
        });
    }).then(() => {
        return {
            message: `Success! ${data.email} has been made an admin`
        }
    }).catch(err => {
        return err;
    });
});

// remove admin role
exports.removeAdminRole = functions.https.onCall((data, context) => {
    // check request is made by an admin
    if (context.auth.token.admin !== true) {
        return { error: 'only, admins can remove other admins, sucker!' }
    }

    // get user and add custom claim (admin)
    return admin.auth().getUserByEmail(data.email).then(user => {
        return admin.auth().setCustomUserClaims(user.uid, {
            admin: false
        });
    }).then(() => {
        return {
            message: `Success! ${data.email} has been removed from admin`
        }
    }).catch(err => {
        return err;
    });
});
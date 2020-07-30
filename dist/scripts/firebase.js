// Your web app's Firebase configuration
var firebaseConfig = {
  // FIREBASE CONFIG HERE
};
// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Firebase auth and firestore ref
const auth = firebase.auth();
const db = firebase.firestore();
const functions = firebase.functions();

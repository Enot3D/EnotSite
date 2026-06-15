var firebaseConfig = {
    apiKey: "AIzaSyC4VGcpuh948AJi61O-AIJ8xlj9g17cwE4",
    authDomain: "enotsite-faf0e.firebaseapp.com",
    projectId: "enotsite-faf0e",
    storageBucket: "enotsite-faf0e.firebasestorage.app",
    messagingSenderId: "44283645775",
    appId: "1:44283645775:web:92222dc23c882cae8fbf3a",
    measurementId: "G-CSHBY0E1WM"
};

var firebaseApp = firebase.initializeApp(firebaseConfig);
var db = firebase.firestore();
var auth = firebase.auth();

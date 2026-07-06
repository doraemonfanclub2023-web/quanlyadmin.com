import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getDatabase,
    ref,
    get,
    set,
    update,
    remove,
    push,
    onValue
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

const firebaseConfig = {
    apiKey: "AIzaSyC-U9L1plaQ6pcP7Iecg4RO0GirBjunISM",
    authDomain: "admin-27099.firebaseapp.com",
    databaseURL: "https://admin-27099-default-rtdb.firebaseio.com",
    projectId: "admin-27099",
    storageBucket: "admin-27099.firebasestorage.app",
    messagingSenderId: "510976750235",
    appId: "1:510976750235:web:78d3e138d302235a788c3e"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);

export {
    ref,
    get,
    set,
    update,
    remove,
    push,
    onValue
};

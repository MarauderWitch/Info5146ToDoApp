import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
    apiKey: "AIzaSyCj8Gby9nV5WLOfRlMDKRcW0isXQ5HACBU",
    authDomain: "info5146todoapp.firebaseapp.com",
    projectId: "info5146todoapp",
    storageBucket: "info5146todoapp.firebasestorage.app",
    messagingSenderId: "395951409528",
    appId: "1:395951409528:web:a022f4d7ca7bd6cb1aa08d"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
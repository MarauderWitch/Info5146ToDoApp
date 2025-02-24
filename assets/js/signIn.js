import { auth } from "./firebase.js";
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth";

const provider = new GoogleAuthProvider();

const signInBttn = document.getElementById('signIn');

const sw = new URL('service-worker.js', import.meta.url);

if ('serviceWorker' in navigator) {
    const s = navigator.serviceWorker;
    s.register(sw.href, {
        scope: '/CheckList/'
    }).then(_ => console.log('Service Worker Registered for scope:', sw.href, 'with', import.meta.url))
        .catch(err => console.error('Service Worker Error:', err));
}

function signIn() {
    signInWithPopup(auth, provider).then((result) => {
        const credential = GoogleAuthProvider.credentialFromResult(result);
        const token = credential.accessToken;
        const user = result.user;
        localStorage.setItem("email", JSON.stringify(user.email));
        window.location = "tasks.html";
    }).catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
        const email = error.customData.email;
        const credential = GoogleAuthProvider.credentialFromError(error);
    });
}

signInBttn.addEventListener("click", function(event) {
    signIn(auth, provider);
});
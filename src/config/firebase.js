import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
    apiKey: "AIzaSyBzZGIWEk4m_ODCRgqQYInXV2GPZrJvNfU",
    authDomain: "campusclaim.firebaseapp.com",
    projectId: "campusclaim",
    storageBucket: "campusclaim.firebasestorage.app",
    messagingSenderId: "340896257221",
    appId: "1:340896257221:web:d20c42402211291bfe0cac",
    measurementId: "G-BVKEGLEFSW"
  };

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export { db, storage };

import { initializeApp, getApps } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyAbwo_J-YJI_WAxCervxHsHP8xOIjV_RLo",
  authDomain: "json-upload-e50c9.firebaseapp.com",
  databaseURL: "https://json-upload-e50c9-default-rtdb.firebaseio.com",
  projectId: "json-upload-e50c9",
  storageBucket: "json-upload-e50c9.firebasestorage.app",
  messagingSenderId: "64654118375",
  appId: "1:64654118375:web:5ab17f7161be3a893d0142",
  measurementId: "G-TLN7FPLWCR"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const database = getDatabase(app);

export { app, database };

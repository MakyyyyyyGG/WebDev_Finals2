import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getDatabase, get, ref, child } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-database.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-auth.js";

		// TODO: Add SDKs for Firebase products that you want to use
		// https://firebase.google.com/docs/web/setup#available-libraries

		// Your web app's Firebase configuration
		const firebaseConfig = {
			apiKey: "AIzaSyDs1lfKYOB5--BiDaVHBWu9baIM8GHAnlo",
			authDomain: "sample-42d4a.firebaseapp.com",
			projectId: "sample-42d4a",
			storageBucket: "sample-42d4a.appspot.com",
			messagingSenderId: "508468942956",
			appId: "1:508468942956:web:65600c02f26dfd1b1f2049"
		};

		// Initialize Firebase
		const app = initializeApp(firebaseConfig);
		const db = getDatabase();
		const auth = getAuth(app);
		const dbref = ref(db);


		



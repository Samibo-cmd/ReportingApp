// Authentication related functions
const auth = {
    registerUser: function() {
        const email = document.getElementById("register-email").value;
        const password = document.getElementById("register-password").value;
        window.auth.createUserWithEmailAndPassword(email, password)
            .then(() => {
                window.location.href = "home.html";
            })
            .catch(error => console.error("Error registering user: ", error));
    },

    loginUser: function() {
        if (!window.auth) {
            console.error("Auth not initialized");
            alert("Please wait for system initialization");
            return;
        }

        const email = document.getElementById("login-email").value;
        const password = document.getElementById("login-password").value;
        
        window.auth.signInWithEmailAndPassword(email, password)
            .then(() => {
                window.location.href = "home.html";
            })
            .catch(error => {
                console.error("Error logging in: ", error);
                alert("Login failed: " + error.message);
            });
    },

    logoutUser: function() {
        if (!window.auth) {
            console.error("Auth not initialized");
            window.location.href = "index.html";
            return;
        }
        
        window.auth.signOut()
            .then(() => {
                window.location.href = "index.html";
            })
            .catch(error => {
                console.error("Error logging out: ", error);
                window.location.href = "index.html";
            });
    },

    checkAuthStatus: function() {
        if (window.auth) {
            console.log("Initial Auth status:", window.auth.currentUser ? "User logged in" : "User not logged in");
        } else {
            console.log("Auth not initialized yet");
        }
    }
};

export default auth;
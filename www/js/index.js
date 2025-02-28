// Citizens Reporting Solution App - Cordova + Firebase

const JSONBIN_URL = "https://api.jsonbin.io/v3/b/67bf3079acd3cb34a8f14391";
const JSONBIN_SECRET = "$2a$10$k7xDAR2DmKSfqw8qgv2Kk.5WISBmpgY6av5nZg7FyLhMmY3yh.Vrq";

let db, storage, auth;

// Initialize Firebase
document.addEventListener('deviceready', function() {
    // Initialize Firebase immediately
    const firebaseConfig = {
        apiKey: "AIzaSyBKWE8ZJX0YlGYjGEHyV_EI_vvxZDG_ByM",
        authDomain: "citizen-reporting-app.firebaseapp.com",
        projectId: "citizen-reporting-app",
        storageBucket: "citizen-reporting-app.appspot.com",
        messagingSenderId: "654321098765",
        appId: "1:654321098765:web:abc123def456ghi789jkl"
    };
    
    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const storage = firebase.storage();
    const auth = firebase.auth();

    // Add event listeners after Firebase is initialized
    if (document.getElementById('login-email')) {
        document.querySelector('button').addEventListener('click', loginUser);
    }

    // Call fetchIncidents if we're on the home page
    if (window.location.pathname.includes('home.html')) {
        fetchIncidents();
    }
});

// Redirect if user is authenticated
auth.onAuthStateChanged(user => {
  if (user) {
      if (window.location.pathname.includes("landingpage.html") || window.location.pathname.includes("register.html")) {
          window.location.href = "home.html";
      }
  } else {
      if (window.location.pathname.includes("home.html") || window.location.pathname.includes("report.html")) {
          window.location.href = "landingpage.html";
      }
  }
});

// User Authentication
function registerUser() {
    const email = document.getElementById("register-email").value;
    const password = document.getElementById("register-password").value;
    auth.createUserWithEmailAndPassword(email, password)
        .then(() => {
            window.location.href = "home.html";
        })
        .catch(error => console.error("Error registering user: ", error));
}

function loginUser() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;
    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            window.location.href = "home.html";
        })
        .catch(error => console.error("Error logging in: ", error));
}

function logoutUser() {
    auth.signOut()
        .then(() => {
            window.location.href = "landingpage.html";
        })
        .catch(error => console.error("Error logging out: ", error));
}

// Get Current Location using Cordova Geolocation Plugin
function getCurrentLocation() {
    navigator.geolocation.getCurrentPosition(
        position => {
            document.getElementById("incident-latitude").value = position.coords.latitude;
            document.getElementById("incident-longitude").value = position.coords.longitude;
        },
        error => {
            console.error("Error getting location: ", error);
        },
        { enableHighAccuracy: true }
    );
}

// Submit Incident
function submitIncident() {
    const title = document.getElementById("incident-title").value;
    const description = document.getElementById("incident-description").value;
    const category = document.getElementById("incident-category").value;
    const latitude = document.getElementById("incident-latitude").value;
    const longitude = document.getElementById("incident-longitude").value;
    const imageFile = document.getElementById("incident-image").files[0];
    
    const user = auth.currentUser;
    if (!user) {
        alert("Please log in to submit an incident.");
        return;
    }
    
    if (!title || !description || !category || !latitude || !longitude || !imageFile) {
        alert("Please fill in all fields and upload an image.");
        return;
    }

    const incidentRef = db.collection("incidents").doc();
    
    let uploadTask = storage.ref(`images/${incidentRef.id}`).put(imageFile);
    uploadTask.then(snapshot => snapshot.ref.getDownloadURL())
        .then(imageURL => {
            const incidentData = {
                userId: user.uid,
                title,
                description,
                category,
                latitude,
                longitude,
                imageURL,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                id: incidentRef.id
            };

            // Save to both Firebase and JSONbin
            return Promise.all([
                // Save to Firebase
                incidentRef.set(incidentData),
                // Update JSONbin
                fetch(JSONBIN_URL, {
                    method: 'GET',
                    headers: {
                        'X-Master-Key': JSONBIN_SECRET
                    }
                })
                .then(response => {
                    if (!response.ok) throw new Error('Failed to fetch from JSONbin');
                    return response.json();
                })
                .then(data => {
                    const incidents = Array.isArray(data.record) ? data.record : [];
                    const jsonbinIncident = {
                        ...incidentData,
                        timestamp: new Date().toISOString()
                    };
                    incidents.push(jsonbinIncident);
                    
                    return fetch(JSONBIN_URL, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-Master-Key': JSONBIN_SECRET
                        },
                        body: JSON.stringify(incidents)
                    });
                })
            ]);
        })
        .then(() => {
            alert("Incident submitted successfully!");
            window.location.href = "home.html";
        })
        .catch(error => {
            console.error("Error adding incident: ", error);
            alert("Failed to submit incident. Please try again.");
        });
}

// Fetch Incidents
function fetchIncidents() {
    // Fetch from Firebase
    db.collection("incidents").orderBy("timestamp", "desc").onSnapshot(snapshot => {
        let firebaseIncidents = [];
        snapshot.forEach(doc => {
            const data = doc.data();
            firebaseIncidents.push({
                ...data,
                id: doc.id,
                timestamp: data.timestamp ? data.timestamp.toDate() : new Date()
            });
        });
        
        // Fetch from JSONbin
        fetch(JSONBIN_URL, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_SECRET
            }
        })
        .then(response => {
            if (!response.ok) throw new Error('Failed to fetch from JSONbin');
            return response.json();
        })
        .then(data => {
            const jsonbinIncidents = Array.isArray(data.record) ? data.record : [];
            // Sort JSONbin incidents by timestamp
            jsonbinIncidents.sort((a, b) => 
                new Date(b.timestamp) - new Date(a.timestamp)
            );
            displayIncidents(firebaseIncidents, jsonbinIncidents);
        })
        .catch(error => {
            console.error("Error fetching JSONbin data: ", error);
            // Still display Firebase incidents if JSONbin fails
            displayIncidents(firebaseIncidents, []);
        });
    }, error => {
        console.error("Error fetching Firebase data: ", error);
        // Try to fetch from JSONbin as fallback
        fetch(JSONBIN_URL, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_SECRET
            }
        })
        .then(response => response.json())
        .then(data => {
            const jsonbinIncidents = Array.isArray(data.record) ? data.record : [];
            displayIncidents([], jsonbinIncidents);
        })
        .catch(error => {
            console.error("Error fetching JSONbin data: ", error);
            displayIncidents([], []);
        });
    });
}

// Display Incidents
function displayIncidents(firebaseIncidents, jsonbinIncidents) {
    const incidentList = document.getElementById("incident-list");
    if (!incidentList) return;
    
    incidentList.innerHTML = "";

    // Display Firebase incidents
    firebaseIncidents.forEach(incident => {
        let div = document.createElement("div");
        div.innerHTML = `
            <h3>${incident.title}</h3>
            <p>${incident.description}</p>
            <p>Category: ${incident.category}</p>
            <img src="${incident.imageURL}" width="200" />
            <p>Location: ${incident.latitude}, ${incident.longitude}</p>
        `;
        incidentList.appendChild(div);
    });

    // Display JSONbin incidents
    const jsonbinSection = document.createElement("div");
    jsonbinSection.innerHTML = "<h2>Historical Incidents from JSONbin</h2>";
    jsonbinIncidents.forEach(incident => {
        let div = document.createElement("div");
        div.innerHTML = `
            <h3>${incident.title}</h3>
            <p>${incident.description}</p>
            <p>Category: ${incident.category}</p>
            <img src="${incident.imageURL}" width="200" />
            <p>Location: ${incident.latitude}, ${incident.longitude}</p>
        `;
        jsonbinSection.appendChild(div);
    });
    incidentList.appendChild(jsonbinSection);
}

// Cordova Device Ready
document.addEventListener("deviceready", function () {
    fetchIncidents();
    getCurrentLocation();
}, false);
  
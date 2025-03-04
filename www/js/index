import auth from './modules/auth.js';
import incidents from './modules/incidents.js';
import location from './modules/location.js';

// Fix the URL constant (it was truncated)
const JSONBIN_URL = "https://api.jsonbin.io/v3/b/67bf3079acd3cb34a8f14391";
const JSONBIN_SECRET = "$2a$10$k7xDAR2DmKSfqw8qgv2Kk.5WISBmpgY6av5nZg7FyLhMmY3yh.Vrq";

// Add convertToBase64 function
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Update fetchAndDisplayIncidents function
async function fetchAndDisplayIncidents() {
    try {
        const response = await fetch(JSONBIN_URL, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_SECRET
            }
        });
        
        if (!response.ok) {
            throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        console.log('JSONbin response:', data); 

        // Simplified check for incidents array
        if (!data.record || !data.record.incidents) {
            const initResponse = await fetch(JSONBIN_URL, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_SECRET
                },
                body: JSON.stringify({
                    incidents: []  // Simplified structure
                })
            });
            if (!initResponse.ok) {
                throw new Error('Failed to initialize incidents array');
            }
            displayIncidents([]);
            return;
        }

        // Simplified access to incidents array
        const incidents = data.record.incidents || [];
        displayIncidents(incidents);
    } catch (error) {
        console.error("Error fetching incidents:", error);
        displayIncidents([]);
    }
}

// Update submitIncident function's PUT request
window.submitIncident = async function() {
    const title = document.getElementById('incident-title').value;
    const description = document.getElementById('incident-description').value;
    const category = document.getElementById('incident-category').value;
    const imageFile = document.getElementById('incident-image').files[0];
    console.log('Form values:', {
        title,
        description,
        category,
        hasImage: !!imageFile
    });
    if (!title || !description || !category) {
        console.log('Validation failed: missing required fields');
        alert('Please fill in all required fields');
        return;
    }
    try {
        const response = await fetch(JSONBIN_URL, {
            method: 'GET',
            headers: {
                'X-Master-Key': JSONBIN_SECRET
            }
        });
        const data = await response.json();
        const currentIncidents = data.record.incidents || []; // Fixed path to incidents array
        // Convert image to base64 if it exists
        let imageData = null;
        if (imageFile) {
            imageData = await convertToBase64(imageFile);
        }
        // Update newIncident object in submitIncident function
        const newIncident = {
            id: 'incident_' + Date.now(),
            title,
            description,
            category,
            address: document.getElementById('location-address').value,
            imageURL: imageData,
            timestamp: new Date().toISOString(),
            userId: firebase.auth().currentUser.uid
        };
        currentIncidents.push(newIncident);
        const updateResponse = await fetch(JSONBIN_URL, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'X-Master-Key': JSONBIN_SECRET
            },
            body: JSON.stringify({
                incidents: currentIncidents  // Simplified structure
            })
        });
        console.log('Update response status:', updateResponse.status);
        const updateData = await updateResponse.json();
        console.log('Update response data:', updateData);
        if (!updateResponse.ok) {
            throw new Error('Failed to submit incident');
        }
        alert('Incident reported successfully!');
        window.location.href = 'home.html';
    } catch (error) {
        console.error('Error submitting incident:', error);
        alert('Failed to submit incident. Please try again.');
    }
};
// Get current location function
function getCurrentLocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            document.getElementById('incident-latitude').value = position.coords.latitude;
            document.getElementById('incident-longitude').value = position.coords.longitude;
        }, function(error) {
            console.error("Error getting location:", error);
            alert("Could not get location. Please try again.");
        });
    } else {
        alert("Geolocation is not supported by your browser");
    }
}
// Add map variables at the top with other constants
let map;
let marker;

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('home.html')) {
        setTimeout(() => {
            fetchAndDisplayIncidents();
        }, 1000);
    } else if (window.location.pathname.includes('report.html')) {
        initMap();
    }
});

// Add map initialization function
// Add address input field to store location name
let locationInput;
// Add this to your map initialization
function initMap() {
    map = L.map('map').setView([9.0820, 8.6753], 6);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Get user's location automatically when the map loads
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            updateLocationFromClick(lat, lng);
            map.setView([lat, lng], 15);
        });
    }

    // Allow clicking on map to update location
    map.on('click', function(e) {
        updateLocationFromClick(e.latlng.lat, e.latlng.lng);
    });
}

// Remove the duplicate closing brace and map.on('click') call
async function updateLocationFromClick(lat, lng) {
    if (marker) {
        marker.setLatLng([lat, lng]);
    } else {
        marker = L.marker([lat, lng]).addTo(map);
    }

    try {
        const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?` +
            `format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
            {
                headers: {
                    'Accept-Language': 'en-US,en;q=0.9',
                    'User-Agent': 'CitizenReportingApp'
                }
            }
        );
        const data = await response.json();
        
        const addressParts = [];
        if (data.address) {
            if (data.address.road) addressParts.push(data.address.road);
            if (data.address.suburb) addressParts.push(data.address.suburb);
            if (data.address.city || data.address.town) addressParts.push(data.address.city || data.address.town);
            if (data.address.state) addressParts.push(data.address.state);
            if (data.address.country) addressParts.push(data.address.country);
        }
        
        const formattedAddress = addressParts.join(', ') || data.display_name;
        document.getElementById('location-address').value = formattedAddress;
    } catch (error) {
        console.error('Error fetching address:', error);
        document.getElementById('location-address').value = 'Address lookup failed';
    }
}
// Update getCurrentLocation function to include address lookup
window.getCurrentLocation = function() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            updateLocation(lat, lng);
            if (map) {
                map.setView([lat, lng], 15);
            }
        }, function(error) {
            console.error("Error getting location:", error);
            alert("Could not get location. Please try again.");
        });
    } else {
        alert("Geolocation is not supported by your browser");
    }
};
// Update location function to include reverse geocoding
async function updateLocation(lat, lng) {
    document.getElementById('incident-latitude').value = lat;
    document.getElementById('incident-longitude').value = lng;

    if (map) {
        if (marker) {
            marker.setLatLng([lat, lng]);
        } else {
            marker = L.marker([lat, lng]).addTo(map);
        }

        // Fetch address from coordinates with more detailed parameters
        try {
            const response = await fetch(
                `https://nominatim.openstreetmap.org/reverse?` +
                `format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`,
                {
                    headers: {
                        'Accept-Language': 'en-US,en;q=0.9',
                        'User-Agent': 'CitizenReportingApp'
                    }
                }
            );
            const data = await response.json();
            
            // Format address more clearly
            const addressParts = [];
            if (data.address) {
                if (data.address.road) addressParts.push(data.address.road);
                if (data.address.suburb) addressParts.push(data.address.suburb);
                if (data.address.city || data.address.town) addressParts.push(data.address.city || data.address.town);
                if (data.address.state) addressParts.push(data.address.state);
                if (data.address.country) addressParts.push(data.address.country);
            }
            
            const formattedAddress = addressParts.join(', ') || data.display_name;
            document.getElementById('location-address').value = formattedAddress;
        } catch (error) {
            console.error('Error fetching address:', error);
            document.getElementById('location-address').value = 'Address lookup failed';
        }
    }
}
// Make it available globally
window.getCurrentLocation = getCurrentLocation;
function displayIncidents(incidents) {
    const incidentList = document.getElementById('incident-list');
    if (!incidentList) return;
    
    incidentList.innerHTML = '';

    incidents.forEach(incident => {
        const date = new Date(incident.timestamp).toLocaleDateString();
        const time = new Date(incident.timestamp).toLocaleTimeString();
        const incidentCard = `
            <div class="incident-card">
                <div class="incident-title">${incident.title || 'Untitled'}</div>
                <div class="incident-details">
                    <p>${incident.description || 'No description available'}</p>
                    <span class="incident-category">${incident.category || 'Uncategorized'}</span>
                    ${incident.imageURL ? 
                        `<div class="incident-image">
                            <img src="${incident.imageURL}" alt="${incident.title}" />
                        </div>` : ''
                    }
                    <div class="incident-location">
                        📍 Location: ${incident.address || 'Location not available'}
                    </div>
                    <div class="incident-timestamp">
                        🕒 Reported on: ${date} at ${time}
                    </div>
                </div>
            </div>
        `;
        incidentList.innerHTML += incidentCard;
    });
}

document.addEventListener('DOMContentLoaded', () => {
    if (window.location.pathname.includes('home.html')) {
        // Add a small delay to ensure Firebase auth is ready
        setTimeout(() => {
            fetchAndDisplayIncidents();
        }, 1000);
    }
});

window.fetchAndDisplayIncidents = fetchAndDisplayIncidents;

const firebaseConfig = {
    apiKey: "AIzaSyCn9ZHemF9Wn5d9P3Pi-dJneuTD3GZQDgI",
    authDomain: "citizens-reporting-app-26de8.firebaseapp.com",
    projectId: "citizens-reporting-app-26de8",
    storageBucket: "citizens-reporting-app-26de8.firebasestorage.app",
    messagingSenderId: "42192559472",
    appId: "1:42192559472:web:8838c524c6ed94d2e643b5"
  };

try {
    if (!firebase.apps.length) {
        firebase.initializeApp(firebaseConfig);
    }
    window.auth = firebase.auth();
    
    
    window.auth.onAuthStateChanged(user => {
        console.log("Auth state changed:", user ? "User logged in" : "User not logged in");
        if (user) {
            if (window.location.pathname.includes("login.html") || 
                window.location.pathname.includes("index.html") || 
                window.location.pathname.includes("register.html")) {
                window.location.href = "home.html";
            }
        } else {
            if (window.location.pathname.includes("home.html") || 
                window.location.pathname.includes("report.html")) {
                window.location.href = "index.html";
            }
        }
    });
} catch (error) {
    console.error("Firebase initialization error:", error);
}
// Remove the duplicate loginUser function and fix the syntax
window.loginUser = async function() {
    const email = document.getElementById("login-email").value;
    const password = document.getElementById("login-password").value;

    try {
        const userCredential = await window.auth.signInWithEmailAndPassword(email, password);
        console.log("Login successful");
        const redirectUrl = sessionStorage.getItem('redirectUrl');
        if (redirectUrl) {
            sessionStorage.removeItem('redirectUrl');
            window.location.href = redirectUrl;
        } else {
            window.location.href = 'home.html';
        }
    } catch (error) {
        console.error("Login error:", error);
        alert("Login failed: " + error.message);
    }
};

// Remove this duplicate section that was causing the error
// firebase.auth().signInWithEmailAndPassword(email, password)... 

// Fix the logout function definition
window.logoutUser = async function() {
    try {
        if (!window.auth) {
            console.error("Auth not initialized");
            window.location.replace('index.html');
            return;
        }
        
        await window.auth.signOut();
        sessionStorage.clear();
        localStorage.clear();
        window.location.replace('index.html');
    } catch (error) {
        console.error("Logout error:", error);
        window.location.replace('index.html');
    }
};

window.registerUser = auth.registerUser;
window.loginUser = auth.loginUser;
window.logoutUser = auth.logoutUser;


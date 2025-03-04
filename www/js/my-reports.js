const firebaseConfig = {
    apiKey: "AIzaSyCn9ZHemF9Wn5d9P3Pi-dJneuTD3GZQDgI",
    authDomain: "citizens-reporting-app-26de8.firebaseapp.com",
    projectId: "citizens-reporting-app-26de8",
    storageBucket: "citizens-reporting-app-26de8.firebasestorage.app",
    messagingSenderId: "42192559472",
    appId: "1:42192559472:web:8838c524c6ed94d2e643b5"
  };

// JSONbin configuration
const JSONBIN_URL = 'https://api.jsonbin.io/v3/b/67bf3079acd3cb34a8f14391';
const JSONBIN_KEY = '$2a$10$k7xDAR2DmKSfqw8qgv2Kk.5WISBmpgY6av5nZg7FyLhMmY3yh.Vrq';

// Initialize Firebase with compat version
if (!firebase.apps.length) {
    firebase.initializeApp(firebaseConfig);
}

// Update loadMyIncidents function
async function loadMyIncidents() {
    try {
        const currentUser = firebase.auth().currentUser;

        if (!currentUser) {
            console.log('No user found, waiting for auth state');
            return;
        }

        // Update to correct JSONbin URL
        const response = await axios.get(JSONBIN_URL, {
            headers: {
                'X-Master-Key': JSONBIN_KEY
            }
        });

        const incidents = response.data.record.incidents || [];

        const userIncidents = incidents.filter(incident => incident.userId === currentUser.uid);
        console.log('User incidents:', userIncidents);

        const incidentsContainer = document.getElementById('my-incidents');
        incidentsContainer.innerHTML = '';

        if (userIncidents.length === 0) {
            incidentsContainer.innerHTML = '<p>You have not reported any incidents yet.</p>';
            return;
        }

        userIncidents.forEach(incident => {
            const incidentCard = `
                <div class="incident-card" id="incident-${incident.id}">
                    <h3>${incident.title}</h3>
                    <p>${incident.description}</p>
                    <p><strong>Location:</strong> ${incident.address}</p>
                    <p><strong>Category:</strong> ${incident.category}</p>
                    ${incident.imageURL ? `<img src="${incident.imageURL}" class="incident-image" alt="Incident Image">` : ''}
                    <div class="incident-actions">
                        <button class="edit-btn" onclick="editIncident('${incident.id}')">Edit</button>
                        <button class="delete-btn" onclick="deleteIncident('${incident.id}')">Delete</button>
                    </div>
                </div>
            `;
            incidentsContainer.innerHTML += incidentCard;
        });
    } catch (error) {
        console.error('Error loading incidents:', error);
        alert('Error loading incidents. Please try again later.');
    }
}
// Function to edit incident
// Add modal HTML when page loads
document.addEventListener('DOMContentLoaded', () => {
    const modalHTML = `
        <div id="editModal" class="modal">
            <div class="modal-content">
                <span class="close">&times;</span>
                <h2>Edit Incident</h2>
                <input type="text" id="edit-title" placeholder="Incident Title">
                <textarea id="edit-description" placeholder="Describe the incident..."></textarea>
                <select id="edit-category">
                    <option value="Accident">Accident</option>
                    <option value="Fighting">Fighting</option>
                    <option value="Rioting">Rioting</option>
                    <option value="Others">Others</option>
                </select>
                <input type="text" id="edit-location" readonly>
                <img id="edit-image" class="incident-image" style="max-width: 100%; display: none;">
                <input type="file" id="edit-new-image">
                <button onclick="updateIncident()">Update Incident</button>
            </div>
        </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHTML);
});

// Update editIncident function
function editIncident(incidentId) {
    try {
        axios.get(JSONBIN_URL, {
            headers: {
                'X-Master-Key': JSONBIN_KEY
            }
        })
        .then(response => {
            const incident = response.data.record.incidents.find(inc => inc.id === incidentId);
            if (incident) {
                // Populate modal with incident data
                document.getElementById('edit-title').value = incident.title;
                document.getElementById('edit-description').value = incident.description;
                document.getElementById('edit-category').value = incident.category;
                document.getElementById('edit-location').value = incident.address;
                
                const imageElement = document.getElementById('edit-image');
                if (incident.imageURL) {
                    imageElement.src = incident.imageURL;
                    imageElement.style.display = 'block';
                } else {
                    imageElement.style.display = 'none';
                }

                // Store incident ID for update
                localStorage.setItem('editIncidentId', incidentId);

                // Show modal
                const modal = document.getElementById('editModal');
                modal.style.display = 'block';

                // Close modal when clicking X
                const closeBtn = document.getElementsByClassName('close')[0];
                closeBtn.onclick = function() {
                    modal.style.display = 'none';
                }

                // Close modal when clicking outside
                window.onclick = function(event) {
                    if (event.target == modal) {
                        modal.style.display = 'none';
                    }
                }
            }
        });
    } catch (error) {
        console.error('Error loading incident details:', error);
        alert('Error loading incident details. Please try again.');
    }
}

// Add updateIncident function
async function updateIncident() {
    const incidentId = localStorage.getItem('editIncidentId');
    const newImage = document.getElementById('edit-new-image').files[0];
    
    try {
        const response = await axios.get(JSONBIN_URL, {
            headers: {
                'X-Master-Key': JSONBIN_KEY
            }
        });

        let data = response.data.record;
        const incidentIndex = data.incidents.findIndex(inc => inc.id === incidentId);

        if (incidentIndex !== -1) {
            // Prepare updated incident data
            const updatedIncident = {
                ...data.incidents[incidentIndex],
                title: document.getElementById('edit-title').value,
                description: document.getElementById('edit-description').value,
                category: document.getElementById('edit-category').value,
            };

            // Handle new image if uploaded
            if (newImage) {
                const imageData = await convertToBase64(newImage);
                updatedIncident.imageURL = imageData;
            }

            // Update incident in array
            data.incidents[incidentIndex] = updatedIncident;

            // Save to JSONbin
            await axios.put(JSONBIN_URL, data, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Master-Key': JSONBIN_KEY
                }
            });

            // Close modal and refresh
            document.getElementById('editModal').style.display = 'none';
            loadMyIncidents();
            alert('Incident updated successfully!');
        }
    } catch (error) {
        console.error('Error updating incident:', error);
        alert('Error updating incident. Please try again.');
    }
}

// Add convertToBase64 function if not already present
function convertToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Make updateIncident available globally
window.updateIncident = updateIncident;

// Function to delete incident
// Update delete function with the same URL and headers
function deleteIncident(incidentId) {
    if (confirm('Are you sure you want to delete this incident?')) {
        try {
            axios.get(JSONBIN_URL, {
                headers: {
                    'X-Master-Key': JSONBIN_KEY
                }
            })
            .then(response => {
                let data = response.data.record;
                data.incidents = data.incidents.filter(incident => incident.id !== incidentId);

                return axios.put(JSONBIN_URL, data, {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Master-Key': JSONBIN_KEY
                    }
                });
            })
            .then(() => {
                document.getElementById(`incident-${incidentId}`).remove();
                alert('Incident deleted successfully');
            })
            .catch(error => {
                console.error('Error deleting incident:', error);
                alert('Error deleting incident. Please try again later.');
            });
        } catch (error) {
            console.error('Error deleting incident:', error);
            alert('Error deleting incident. Please try again later.');
        }
    }
}

// Add this function for filtering
function filterIncidents() {
    const selectedCategory = document.getElementById('category-filter').value;
    const incidentCards = document.querySelectorAll('.incident-card');

    incidentCards.forEach(card => {
        const categoryText = card.querySelector('p:nth-child(4)').textContent; // Gets the category text
        const category = categoryText.split(':')[1].trim(); // Extracts just the category value

        if (selectedCategory === 'all' || category === selectedCategory) {
            card.style.display = 'block';
        } else {
            card.style.display = 'none';
        }
    });
}

// Make functions available globally
window.filterIncidents = filterIncidents;
window.editIncident = editIncident;
window.deleteIncident = deleteIncident;

// Single auth state listener
firebase.auth().onAuthStateChanged((user) => {
    
    if (!user) {
        console.log('No user authenticated, redirecting to login...');
        sessionStorage.setItem('redirectUrl', window.location.href);
        window.location.href = 'index.html';
    } else {
        loadMyIncidents();
    }
});


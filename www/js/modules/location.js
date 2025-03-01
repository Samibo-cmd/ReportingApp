// Location related functions
const location = {
    getCurrentLocation: function() {
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
};

export default location;
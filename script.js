const sitename = "Weather app for school. (https://github.com/ValleyhouseJ/TwoAndAHalfMen)";
const url = "https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=55.4913&lon=9.4758";

// Function to fetch data
async function fetchData() {
    const myRequest = new Request(url, {
        method: 'GET',
        headers: {
            'User-Agent': sitename
        }
    });

    try {
        let response = await fetch(myRequest);

        if (response.status === 203) {
            console.warn('Deprecated product');
        } else if (response.status === 429) {
            console.warn('Throttling');
        }

        if (response.ok) {
            let data = await response.json();
            let expires = response.headers.get('Expires');
            let lastModified = response.headers.get('Last-Modified');

            // Store data and timestamps in local storage
            localStorage.setItem('forecastData', JSON.stringify(data));
            localStorage.setItem('expires', expires);
            localStorage.setItem('lastModified', lastModified);

            console.log(data);
        } else {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

// Function to check if data is still valid
function isDataValid() {
    let expires = localStorage.getItem('expires');
    if (expires) {
        let expiresDate = new Date(expires);
        return new Date() < expiresDate;
    }
    return false;
}

// Main function to get forecast data
async function getForecastData() {
    if (isDataValid()) {
        let data = JSON.parse(localStorage.getItem('forecastData'));
        console.log('Using cached data:', data);
    } else {
        await fetchData();
    }
}

// Function to calculate apparent temperature using both temperature, wind speed and humidity
function calculateApparentTemperature() {
    const forecastData = JSON.parse(localStorage.getItem('forecastData'));
    const temp = forecastData.properties.timeseries[0].data.instant.details.air_temperature;
    const windSpeed = forecastData.properties.timeseries[0].data.instant.details.wind_speed;
    const humidity = forecastData.properties.timeseries[0].data.instant.details.relative_humidity;

    const heatIndex = temp + 0.33 * humidity - 0.7 * windSpeed - 4;
    const windChill = 13.12 + 0.6215 * temp - 11.37 * Math.pow(windSpeed, 0.16) + 0.3965 * temp * Math.pow(windSpeed, 0.16);
    if (temp >= 27 && humidity > 40) { // Use heat index for warm, humid conditions
        return heatIndex;
    } else if (temp <= 10 && windSpeed > 4.8) { // Use wind chill for cold, windy conditions
        return windChill;
    }
}

// Function to update HTML with forecast data
function updateHTMLWithForecastData() {
    let forecastData = JSON.parse(localStorage.getItem('forecastData'));

    if (forecastData) {
        // Assuming forecastData has properties like temperature.
        let temperature = forecastData.properties.timeseries[0].data.instant.details.air_temperature;
        let apparentTemperature = calculateApparentTemperature();


        // Update temperature
        document.getElementById("temperature").textContent = `${temperature}°C`;
        document.getElementById("apparent-temperature").textContent = `${apparentTemperature}°C`;
    }
}

// Listen for changes in local storage
window.addEventListener('storage', (event) => {
    if (event.key === 'forecastData') {
        updateHTMLWithForecastData();
    }
});

// Ensure the DOM is fully loaded before calling the function
document.addEventListener('DOMContentLoaded', (event) => {
    updateHTMLWithForecastData();
});

// Call the main function
getForecastData();
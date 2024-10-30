const sitename = "Weather app for school. (https://github.com/ValleyhouseJ/TwoAndAHalfMen)";
const url = "https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=55.4913&lon=9.4758";

// Function to fetch data
async function fetchData() {
    const myRequest = new Request(url, {
        method: "GET",
        headers: {
            "User-Agent": sitename
        }
    });

    try {
        let response = await fetch(myRequest);

        if (response.status === 203) {
            console.warn("Deprecated product");
        } else if (response.status === 429) {
            console.warn("Throttling");
        }

        if (response.ok) {
            let data = await response.json();
            let expires = response.headers.get("Expires");
            let lastModified = response.headers.get("Last-Modified");

            // Store data and timestamps in local storage
            localStorage.setItem("forecastData", JSON.stringify(data));
            localStorage.setItem("expires", expires);
            localStorage.setItem("lastModified", lastModified);

            console.log(data);
        } else {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }
    } catch (error) {
        console.error("Fetch error:", error);
    }
}

// Function to check if data is still valid
function isDataValid() {
    let expires = localStorage.getItem("expires");
    if (expires) {
        let expiresDate = new Date(expires);
        return new Date() < expiresDate;
    }
    return false;
}

// Main function to get forecast data
async function getForecastData() {
    if (isDataValid()) {
        let data = JSON.parse(localStorage.getItem("forecastData"));
        console.log("Using cached data:", data);
    } else {
        await fetchData();
    }
}

// Function to calculate apparent temperature using both temperature, wind speed and humidity
function calculateApparentTemperature() {
    const forecastData = JSON.parse(localStorage.getItem("forecastData"));
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
    return temp; // Default return value
}

// Function to update HTML with forecast data
function updateHTMLWithForecastData() {
    let forecastData = JSON.parse(localStorage.getItem("forecastData"));

    if (forecastData) {
        // Assuming forecastData has properties like temperature.
        let temperature = forecastData.properties.timeseries[0].data.instant.details.air_temperature;
        let apparentTemperature = calculateApparentTemperature();
        let windSpeed = forecastData.properties.timeseries[0].data.instant.details.wind_speed;
        let precipitation = forecastData.properties.timeseries[0].data.next_1_hours.details.precipitation_amount;
        let uvIndex = forecastData.properties.timeseries[0].data.instant.details.ultraviolet_index_clear_sky;
        let weatherSymbol = forecastData.properties.timeseries[0].data.next_1_hours.summary.symbol_code;

        // Update temperature
        document.getElementById("temperature-hero").textContent = `${temperature}°`;
        document.getElementById("feels-like").textContent = `Føles som ${apparentTemperature}°`;

        // Update additional information
        document.getElementById("wind-speed-text").textContent = `${windSpeed} m/s`;
        document.getElementById("precipitation-text").textContent = `${precipitation} mm`;
        document.getElementById("uv-text").textContent = `${uvIndex} UV`;

        // Update weather icon
        const weatherIconImg = document.getElementById("weather-icon-img");
        weatherIconImg.src = `./svg/${weatherSymbol}.svg`;
        weatherIconImg.alt = `Ikon for ${weatherSymbol}`;

        // Update time-container
        const timeRows = document.querySelectorAll(".time-container tbody tr");
        forecastData.properties.timeseries.slice(0, timeRows.length).forEach((timeseries, index) => {
            const time = new Date(timeseries.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const temp = timeseries.data.instant.details.air_temperature;
            const precip = timeseries.data.next_1_hours ? timeseries.data.next_1_hours.details.precipitation_amount : 0;
            const wind = timeseries.data.instant.details.wind_speed;
            const symbol = timeseries.data.next_1_hours ? timeseries.data.next_1_hours.summary.symbol_code : "clearsky_day";

            const row = timeRows[index];
            row.querySelector(".time-box").textContent = time;
            row.querySelector(".time-icon-img").setAttribute("src", `./svg/${symbol}.svg`);
            row.querySelector(".time-icon-img").setAttribute("alt", `Weather Icon for ${symbol}`);
            row.querySelector(".temperature").textContent = `${temp}°`;
            row.querySelector(".number").textContent = precip;
            row.querySelector(".dot").textContent = wind;
        });
    }
}

// Function to update the current time and date
function updateCurrentTime() {
    const currentTimeElement = document.getElementById("time");
    const currentDateElement = document.getElementById("date");
    const now = new Date();

    // Update time
    currentTimeElement.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    currentTimeElement.setAttribute("datetime", now.toISOString());

    // Update date
    currentDateElement.textContent = `I dag ${now.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" })}`;
}

// Listen for changes in local storage
window.addEventListener("storage", (event) => {
    if (event.key === "forecastData") {
        updateHTMLWithForecastData();
    }
});

// Ensure the DOM is fully loaded before calling the function
document.addEventListener("DOMContentLoaded", () => {
    updateHTMLWithForecastData();
    updateCurrentTime();
    setInterval(updateCurrentTime, 1000); // Update time every second

    // Add event listener to refresh icon
    document.getElementById("header-settings").addEventListener("click", () => {
        location.reload(); // Reload the page
    });
});

// Call the main function to get forecast data
getForecastData();
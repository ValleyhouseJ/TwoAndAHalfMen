// Function to fetch data from the weather API
async function fetchData() {
    // Site name and API URL
    const sitename = "Weather app for school. (https://github.com/ValleyhouseJ/TwoAndAHalfMen)";
    const url = "https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=55.4913&lon=9.4758";
    const myRequest = new Request(url, {
        method: "GET",
        headers: {
            "User-Agent": sitename
        }
    });

    try {
        let response = await fetch(myRequest);

        // Check for specific response statuses
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

// Function to check if the cached data is still valid based on the expiration time
// Expires is given in the HTTP header of the response
function isDataValid() {
    let expires = localStorage.getItem("expires");
    if (expires) {
        let expiresDate = new Date(expires);
        return new Date() < expiresDate;
    }
    return false;
}

// Main function to get forecast data, either from cache or by fetching new data
async function getForecastData() {
    if (isDataValid()) {
        let data = JSON.parse(localStorage.getItem("forecastData"));
        console.log("Using cached data:", data);
    } else {
        await fetchData();
    }
}

// Function to calculate apparent temperature using temperature, wind speed, and humidity
function calculateApparentTemperature() {
    const forecastData = JSON.parse(localStorage.getItem("forecastData"));
    const temp = forecastData.properties.timeseries[0].data.instant.details.air_temperature;
    const windSpeed = forecastData.properties.timeseries[0].data.instant.details.wind_speed;
    const humidity = forecastData.properties.timeseries[0].data.instant.details.relative_humidity;

    // Calculate heat index and wind chill
    const heatIndex = temp + 0.33 * humidity - 0.7 * windSpeed - 4;
    const windChill = 13.12 + 0.6215 * temp - 11.37 * Math.pow(windSpeed, 0.16) + 0.3965 * temp * Math.pow(windSpeed, 0.16);
    if (temp >= 27 && humidity > 40) { // Use heat index for warm, humid conditions
        return heatIndex;
    } else if (temp <= 10 && windSpeed > 4.8) { // Use wind chill for cold, windy conditions
        return windChill;
    }
    return temp; // Default return value
}

// Function to update HTML elements with forecast data
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
        const temperatureElement = document.querySelector(".temperature");
        if (temperatureElement) {
            temperatureElement.textContent = `${temperature}°`;
        }

        const feelsLikeElement = document.querySelector(".temperature-feels-like");
        if (feelsLikeElement) {
            feelsLikeElement.textContent = `Føles som ${apparentTemperature}°`;
        }

        // Update additional information
        const windSpeedElement = document.querySelector(".wind-speed");
        if (windSpeedElement) {
            windSpeedElement.textContent = `${windSpeed} m/s`;
        }

        const precipitationElement = document.querySelector(".amount-of-rainfall-mm");
        if (precipitationElement) {
            precipitationElement.textContent = `${precipitation} mm`;
        }

        const uvIndexElement = document.querySelector(".uv-index");
        if (uvIndexElement) {
            uvIndexElement.textContent = `${uvIndex} UV`;
        }

        // Update weather icon
        const weatherIconImg = document.querySelector("#weather-icon-img");
        if (weatherIconImg) {
            weatherIconImg.src = `./svg/${weatherSymbol}.svg`;
            weatherIconImg.alt = `Ikon for ${weatherSymbol}`;
        }

        // Update time-container with forecast data for each time slot
        const timeRows = document.querySelectorAll(".weather-table tbody tr");
        forecastData.properties.timeseries.slice(0, timeRows.length).forEach((timeseries, index) => {
            const time = new Date(timeseries.time).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
            const temp = timeseries.data.instant.details.air_temperature;
            const precip = timeseries.data.next_1_hours ? timeseries.data.next_1_hours.details.precipitation_amount : 0;
            const wind = timeseries.data.instant.details.wind_speed;
            const symbol = timeseries.data.next_1_hours ? timeseries.data.next_1_hours.summary.symbol_code : "clearsky_day";

            const row = timeRows[index];
            if (row) {
                const hoursElement = row.querySelector(".hours");
                if (hoursElement) {
                    hoursElement.textContent = time;
                }

                const weatherIconElement = row.querySelector(".weather-info-hours img");
                if (weatherIconElement) {
                    weatherIconElement.setAttribute("src", `./svg/${symbol}.svg`);
                    weatherIconElement.setAttribute("alt", `Weather Icon for ${symbol}`);
                    weatherIconElement.setAttribute("width", `20`);
                }

                const tempElement = row.querySelector(".temp");
                if (tempElement) {
                    tempElement.textContent = `${temp}°`;
                }

                const precipElement = row.querySelectorAll(".weather-info-hours")[2];
                if (precipElement) {
                    const precipP = document.createElement("p");
                    precipP.textContent = `${precip} mm`;
                    precipElement.appendChild(precipP);
                }

                const windSpeedElement = row.querySelector(".hourly-wind-speed");
                if (windSpeedElement) {
                    windSpeedElement.textContent = `${wind} m/s`;
                }
            }
        });

        // Get the current day index (0 for Sunday, 1 for Monday)
        const todayIndex = new Date().getDay();
        const days = ["Søndag", "Mandag", "Tirsdag", "Onsdag", "Torsdag", "Fredag", "Lørdag"];

        // Generate the array of days starting from the current day using map function with modulus to wrap around the week
        const orderedDays = Array.from({ length: 7 }, (_, i) => days[(todayIndex + i) % 7]);

        // Update daily forecast data for the next 7 days in the overview table with forecast data for each time slot
        const dailyRows = document.querySelectorAll("#overview-next-following-days tbody tr");

        // Process the forecast data
        forecastData.properties.timeseries.forEach((timeseries, index) => {            
            const dayIndex = Math.floor(index / 4);
            const timeOfDayIndex = index % 4;
            const temp = timeseries.data.instant.details.air_temperature;
            const windSpeed = timeseries.data.instant.details.wind_speed;
            const symbol = timeseries.data.next_1_hours ? timeseries.data.next_1_hours.summary.symbol_code : "clearsky_day";

            if (dayIndex < dailyRows.length) {
                const row = dailyRows[dayIndex];
                if (row) {
                    if (timeOfDayIndex === 0) {
                        const dayElement = row.querySelector(".day");
                        if (dayElement) {
                            dayElement.textContent = orderedDays[dayIndex];
                        }

                        const tempElement = row.querySelector(".temp");
                        if (tempElement) {
                            tempElement.textContent = `${temp}°`;
                        }

                        const windSpeedElement = row.querySelector(".wind-speed");
                        if (windSpeedElement) {
                            windSpeedElement.textContent = `${windSpeed} m/s`;
                        }
                    }

                    const weatherIcons = row.querySelectorAll(".weather-icon img");
                    if (weatherIcons[timeOfDayIndex]) {
                        weatherIcons[timeOfDayIndex].setAttribute("src", `./svg/${symbol}.svg`);
                        weatherIcons[timeOfDayIndex].setAttribute("alt", `Weather Icon for ${symbol}`);
                        weatherIcons[timeOfDayIndex].setAttribute("width", `34`);
                    }
                }
            }
        });
    }
}

// Function to update the current time and date in the HTML
function updateCurrentTime() {
    const currentTimeElement = document.querySelector("#time-tag");
    const currentDateElement = document.querySelector("#date");
    const now = new Date();

    // Update time
    currentTimeElement.textContent = now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    currentTimeElement.setAttribute("datetime", now.toISOString());

    // Update date
    currentDateElement.textContent = `I dag ${now.toLocaleDateString("da-DK", { weekday: "long", day: "numeric", month: "long" })}`;
}

// Listen for changes in local storage and update HTML if forecast data changes
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
    document.querySelector(".icon-container").addEventListener("click", () => {
        location.reload(); // Reload the page
    });
});

// Call the main function to get forecast data
getForecastData();
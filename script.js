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

// Call the main function
getForecastData();
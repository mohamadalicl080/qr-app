// Google Sheets API configuration
const API_KEY = 'AIzaSyBgp_1Ujzgfd7vnzh0yyN-_jEQYmj4wC20';
const SPREADSHEET_ID = '1gZya2Vpk9lbFczvycPZYcamIGhh7WE5hAEZ6NLc0VlY';
const RANGE = 'Hoja1!A2:C';

let html5QrcodeScanner = null;
let isApiReady = false;

// Initialize Google Sheets API
async function initGoogleSheetsAPI() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        });
        console.log('Google Sheets API initialized successfully');
        isApiReady = true;
    } catch (error) {
        console.error('Error initializing Google Sheets API:', error);
        showStatus('red', 'Error al conectar con la base de datos. Por favor, recarga la página.');
    }
}

// Load the Google Sheets API
function loadGoogleAPI() {
    console.log('Loading Google API...');
    gapi.load('client', initGoogleSheetsAPI);
}

// Function to check vehicle status
async function checkVehicleStatus(plate) {
    if (!isApiReady) {
        showStatus('red', 'El sistema está iniciando. Por favor, espera unos segundos y vuelve a intentar.');
        return;
    }

    try {
        console.log('Checking plate:', plate);
        showStatus('yellow', 'Verificando...');

        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGE,
        });

        console.log('API Response:', response);

        const rows = response.result.values;
        if (!rows || rows.length === 0) {
            console.log('No data found in spreadsheet');
            showStatus('red', 'No se encontraron datos en la base de datos');
            return;
        }

        const vehicleData = rows.find(row => row[0] && row[0].toUpperCase() === plate.toUpperCase());

        if (!vehicleData) {
            console.log('Vehicle not found:', plate);
            showStatus('red', `Vehículo no registrado\nPatente: ${plate.toUpperCase()}`);
            return;
        }

        console.log('Vehicle data found:', vehicleData);

        const debt = parseFloat(vehicleData[1]) || 0;
        const paymentPercentage = parseFloat(vehicleData[2]) || 0;

        if (debt <= 0) {
            showStatus('green', `✅ ACCESO PERMITIDO\nPatente: ${plate.toUpperCase()}\nSin deuda pendiente`);
        } else if (paymentPercentage >= 60) {
            showStatus('yellow', `⚠️ ACCESO PERMITIDO\nPatente: ${plate.toUpperCase()}\nDeuda: $${debt.toLocaleString()}\nPago: ${paymentPercentage}%`);
        } else {
            showStatus('red', `❌ ACCESO DENEGADO\nPatente: ${plate.toUpperCase()}\nDeuda: $${debt.toLocaleString()}\nPago: ${paymentPercentage}%`);
        }
    } catch (error) {
        console.error('Error checking vehicle status:', error);
        showStatus('red', `Error al verificar el estado: ${error.message}`);
    }
}

// Function to show status
function showStatus(color, message) {
    const statusDiv = document.getElementById('status');
    const statusText = document.getElementById('status-text');
    
    statusDiv.style.display = 'flex';
    statusDiv.className = `status-display ${color}`;
    statusText.innerHTML = message.replace(/\n/g, '<br>');
}

// Function to check plate from manual input
function checkPlate() {
    const plateInput = document.getElementById('plate-input');
    const plate = plateInput.value.trim().toUpperCase();
    if (plate) {
        checkVehicleStatus(plate);
    } else {
        showStatus('red', 'Por favor ingrese una patente');
    }
}

// Function to start QR scanner
function startScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear();
    }

    const qrReader = document.getElementById('qr-reader');
    qrReader.style.display = 'block';

    html5QrcodeScanner = new Html5QrcodeScanner(
        "qr-reader", 
        { 
            fps: 10, 
            qrbox: {width: 250, height: 250},
            rememberLastUsedCamera: true,
        }
    );

    html5QrcodeScanner.render((decodedText) => {
        html5QrcodeScanner.clear();
        qrReader.style.display = 'none';
        checkVehicleStatus(decodedText);
    }, (error) => {
        // Handle QR scan errors silently
    });
}

// Event listener for Enter key in plate input
document.getElementById('plate-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        checkPlate();
    }
});

// Add error event listener for global error handling
window.addEventListener('error', function(event) {
    console.error('Global error:', event.error);
    showStatus('red', 'Error en la aplicación. Por favor, recarga la página.');
});

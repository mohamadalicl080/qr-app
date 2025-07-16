// Google Sheets API configuration
const API_KEY = 'AIzaSyBgp_1Ujzgfd7vnzh0yyN-_jEQYmj4wC20';
const SPREADSHEET_ID = '1gZya2Vpk9lbFczvycPZYcamIGhh7WE5hAEZ6NLc0VlY';
const RANGE = 'Hoja1!A2:C'; // Ajustado para tu hoja

let html5QrcodeScanner = null;

// Initialize Google Sheets API
function initGoogleSheetsAPI() {
    gapi.client.init({
        'apiKey': API_KEY,
        'discoveryDocs': ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
    }).then(function() {
        console.log('Google Sheets API initialized');
    }).catch(function(error) {
        console.error('Error initializing Google Sheets API:', error);
        showStatus('red', 'Error al conectar con la base de datos');
    });
}

// Load the Google Sheets API
gapi.load('client', initGoogleSheetsAPI);

// Function to check vehicle status
async function checkVehicleStatus(plate) {
    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGE,
        });

        const rows = response.result.values;
        if (!rows) {
            showStatus('red', 'No se encontraron datos en la hoja de cálculo');
            return;
        }

        const vehicleData = rows.find(row => row[0].toUpperCase() === plate.toUpperCase());

        if (!vehicleData) {
            showStatus('red', `Vehículo no registrado\nPatente: ${plate.toUpperCase()}`);
            return;
        }

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
        console.error('Error:', error);
        showStatus('red', 'Error al verificar el estado');
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
    const plate = document.getElementById('plate-input').value.trim().toUpperCase();
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
        // Manejar errores silenciosamente
    });
}

// Event listener for Enter key in plate input
document.getElementById('plate-input').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        checkPlate();
    }
});
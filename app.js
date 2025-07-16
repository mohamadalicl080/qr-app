// Configuración de la API de Google Sheets
const API_KEY = 'AIzaSyBgp_1Ujzgfd7vnzh0yyN-_jEQYmj4wC20';
const SPREADSHEET_ID = '1gZya2Vpk9lbFczvycPZYcamIGhh7WE5hAEZ6NLc0VlY';
const RANGE = 'Hoja1!A2:C';

let html5QrcodeScanner = null;
let isApiReady = false;

// Inicializar Google Sheets API
async function initGoogleSheetsAPI() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        });
        
        // Verificar conexión silenciosamente
        const testResponse = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Hoja1!A1:A1'
        });
        console.log('Sistema iniciado correctamente');
        isApiReady = true;
    } catch (error) {
        console.error('Error de inicialización:', error);
        showStatus('red', 'Error de conexión. Por favor, recarga la página.');
    }
}

// Cargar la API de Google
function loadGoogleAPI() {
    gapi.load('client', initGoogleSheetsAPI);
}

// Verificar estado del vehículo
async function checkVehicleStatus(plate) {
    if (!plate) {
        showStatus('red', 'Por favor ingrese una patente');
        return;
    }

    if (!isApiReady) {
        showStatus('red', 'Error de conexión. Por favor, recarga la página.');
        return;
    }

    try {
        showStatus('yellow', `Verificando patente: ${plate.toUpperCase()}...`);
        
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGE,
        });

        const rows = response.result.values;
        if (!rows) {
            showStatus('red', 'No se encontraron datos en la base de datos');
            return;
        }

        const vehicleData = rows.find(row => row[0] && row[0].toUpperCase() === plate.toUpperCase());

        if (!vehicleData) {
            showStatus('red', `❌ VEHÍCULO NO REGISTRADO\nPatente: ${plate.toUpperCase()}`);
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
        console.error('Error al verificar:', error);
        showStatus('red', 'Error al verificar. Por favor, intenta nuevamente.');
    }
}

// Mostrar estado
function showStatus(color, message) {
    const statusDiv = document.getElementById('status');
    const statusText = document.getElementById('status-text');
    
    if (statusDiv && statusText) {
        statusDiv.style.display = 'flex';
        statusDiv.className = `status-display ${color}`;
        statusText.innerHTML = message.replace(/\n/g, '<br>');
    }
}

// Verificar patente desde input
function checkPlate() {
    const plateInput = document.getElementById('plate-input');
    if (!plateInput) return;
    
    const plate = plateInput.value.trim().toUpperCase();
    if (plate) {
        checkVehicleStatus(plate);
    } else {
        showStatus('red', 'Por favor ingrese una patente');
    }
}

// Iniciar escáner QR
function startScanner() {
    if (html5QrcodeScanner) {
        html5QrcodeScanner.clear();
    }

    const qrReader = document.getElementById('qr-reader');
    if (!qrReader) return;

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
        // Manejar errores del escáner silenciosamente
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', function() {
    const plateInput = document.getElementById('plate-input');
    if (plateInput) {
        plateInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkPlate();
            }
        });
    }
});

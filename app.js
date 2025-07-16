// Google Sheets API configuration
const API_KEY = 'AIzaSyBgp_1Ujzgfd7vnzh0yyN-_jEQYmj4wC20';
const SPREADSHEET_ID = '1gZya2Vpk9lbFczvycPZYcamIGhh7WE5hAEZ6NLc0VlY';
const RANGE = 'Hoja1!A2:C';

let html5QrcodeScanner = null;
let isApiReady = false;
let initAttempts = 0;
const MAX_INIT_ATTEMPTS = 3;

// Initialize Google Sheets API
async function initGoogleSheetsAPI() {
    try {
        console.log('Intentando inicializar Google Sheets API...');
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        });
        console.log('Google Sheets API inicializada correctamente');
        isApiReady = true;
        
        // Intenta una lectura de prueba
        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: 'Hoja1!A1:A1'
            });
            console.log('Prueba de lectura exitosa:', response);
        } catch (testError) {
            console.error('Error en prueba de lectura:', testError);
            throw testError;
        }
    } catch (error) {
        console.error('Error al inicializar Google Sheets API:', error);
        initAttempts++;
        if (initAttempts < MAX_INIT_ATTEMPTS) {
            console.log(`Reintentando inicialización (intento ${initAttempts + 1}/${MAX_INIT_ATTEMPTS})...`);
            setTimeout(initGoogleSheetsAPI, 2000); // Espera 2 segundos antes de reintentar
        } else {
            showStatus('red', 'Error de conexión. Por favor, recarga la página.');
        }
    }
}

// Load the Google Sheets API
function loadGoogleAPI() {
    console.log('Cargando Google API...');
    gapi.load('client', initGoogleSheetsAPI);
}

// Function to check vehicle status with retry
async function checkVehicleStatus(plate) {
    console.log('Estado de API:', isApiReady);
    if (!isApiReady) {
        if (initAttempts < MAX_INIT_ATTEMPTS) {
            showStatus('yellow', 'Iniciando sistema, por favor espera...');
            await new Promise(resolve => setTimeout(resolve, 2000));
            initGoogleSheetsAPI();
            return;
        } else {
            showStatus('red', 'Error de conexión. Por favor, recarga la página.');
            return;
        }
    }

    try {
        console.log('Verificando patente:', plate);
        showStatus('yellow', 'Verificando...');

        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGE,
        });

        console.log('Respuesta de API:', response);

        const rows = response.result.values;
        if (!rows || rows.length === 0) {
            console.log('No se encontraron datos');
            showStatus('red', 'No se encontraron datos en la base de datos');
            return;
        }

        const vehicleData = rows.find(row => row[0] && row[0].toUpperCase() === plate.toUpperCase());

        if (!vehicleData) {
            console.log('Vehículo no encontrado:', plate);
            showStatus('red', `Vehículo no registrado\nPatente: ${plate.toUpperCase()}`);
            return;
        }

        console.log('Datos del vehículo:', vehicleData);

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
        console.error('Error al verificar vehículo:', error);
        showStatus('red', 'Error al verificar. Por favor, intenta nuevamente.');
    }
}

// Rest of your existing code...

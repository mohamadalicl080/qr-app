// Configuración de la API de Google Sheets
const API_KEY = 'AIzaSyBgp_1Ujzgfd7vnzh0yyN-_jEQYmj4wC20';
const SPREADSHEET_ID = '1gZya2Vpk9lbFczvycPZYcamIGhh7WE5hAEZ6NLc0VlY';
const RANGE = 'Hoja1!A2:C';

let html5QrcodeScanner = null;
let isApiReady = false;
let initializationAttempts = 0;
const MAX_INITIALIZATION_ATTEMPTS = 3;

// Función para mostrar el estado de carga
function showLoading(message) {
    showStatus('yellow', message || 'Cargando... Por favor espere');
}

// Inicializar Google Sheets API con reintentos
async function initGoogleSheetsAPI() {
    if (initializationAttempts >= MAX_INITIALIZATION_ATTEMPTS) {
        showStatus('red', 'No se pudo inicializar el sistema. Por favor, recarga la página.');
        return;
    }

    initializationAttempts++;
    showLoading(`Intento de inicialización ${initializationAttempts}/${MAX_INITIALIZATION_ATTEMPTS}...`);

    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        });

        // Intenta una lectura de prueba inmediatamente
        try {
            const response = await gapi.client.sheets.spreadsheets.values.get({
                spreadsheetId: SPREADSHEET_ID,
                range: 'Hoja1!A1:A1'
            });
            console.log('Prueba de lectura exitosa:', response);
            isApiReady = true;
            showStatus('green', 'Sistema listo para verificar patentes');
        } catch (testError) {
            console.error('Error en prueba de lectura:', testError);
            throw testError;
        }
    } catch (error) {
        console.error(`Error de inicialización (intento ${initializationAttempts}):`, error);
        
        if (initializationAttempts < MAX_INITIALIZATION_ATTEMPTS) {
            setTimeout(() => {
                initGoogleSheetsAPI();
            }, 2000);
        } else {
            showStatus('red', 'Error de conexión. Por favor, recarga la página.');
        }
    }
}

// Cargar la API de Google con reintentos
function loadGoogleAPI() {
    showLoading('Cargando sistema...');
    setTimeout(() => {
        if (!isApiReady) {
            initGoogleSheetsAPI();
        }
    }, 1000);
}

// Verificar estado del vehículo
async function checkVehicleStatus(plate) {
    console.log('Verificando patente:', plate, 'API Ready:', isApiReady);
    
    if (!plate) {
        showStatus('red', 'Por favor ingrese una patente');
        return;
    }

    if (!isApiReady) {
        if (initializationAttempts < MAX_INITIALIZATION_ATTEMPTS) {
            showLoading('Iniciando sistema, por favor espere...');
            await initGoogleSheetsAPI();
            return;
        } else {
            showStatus('red', 'Sistema no inicializado. Por favor, recarga la página.');
            return;
        }
    }

    try {
        showStatus('yellow', `Verificando patente: ${plate.toUpperCase()}...`);
        
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGE,
        });

        console.log('Respuesta de la API:', response);

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

// Resto del código se mantiene igual...

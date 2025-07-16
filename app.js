// Configuración de la API de Google Sheets
const API_KEY = 'AIzaSyBgp_1Ujzgfd7vnzh0yyN-_jEQYmj4wC20';
const SPREADSHEET_ID = '1gZya2Vpk9lbFczvycPZYcamIGhh7WE5hAEZ6NLc0VlY';
const RANGE = 'Hoja1!A2:Z';

let html5QrcodeScanner = null;
let isApiReady = false;

// Inicializar Google Sheets API silenciosamente
async function initGoogleSheetsAPI() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        });
        isApiReady = true;
        console.log('API inicializada correctamente');
        
        // Verificar conexión silenciosamente
        await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Hoja1!A1:A1'
        });
    } catch (error) {
        console.error('Error de inicialización:', error);
    }
}

// Cargar la API de Google silenciosamente
function loadGoogleAPI() {
    gapi.load('client', initGoogleSheetsAPI);
}

// Verificar estado del vehículo con reintento automático
async function checkVehicleStatus(plate) {
    if (!plate) {
        showStatus('red', 'Debe ingresar una patente');
        return;
    }

    // Si la API no está lista, espera brevemente y reintenta
    if (!isApiReady) {
        await new Promise(resolve => setTimeout(resolve, 500));
        if (!isApiReady) {
            showStatus('red', 'Error de conexión. Por favor, recarga la página.');
            return;
        }
    }

    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGE,
        });

        const rows = response.result.values;
        const normalizedPlate = plate.trim().toUpperCase();

        const match = rows.find(row => row[0] && row[0].trim().toUpperCase() === normalizedPlate);

        if (match) {
            const estado = match[match.length - 1]?.trim().toLowerCase();
            if (estado === 'rojo') {
                showStatus('red', `Acceso Denegado: ${match[1] || 'Sin nombre'} (${normalizedPlate})`);
            } else {
                showStatus('green', `Autorizado: ${match[1] || 'Sin nombre'} (${normalizedPlate})`);
            }
        } else {
            showStatus('gray', 'Patente no encontrada en el registro');
        }

    } catch (error) {
        console.error('Error al consultar la planilla:', error);
        showStatus('gray', 'Error al consultar la planilla');
    }
}

// El resto del código permanece igual...

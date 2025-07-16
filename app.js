// Configuración de la API de Google Sheets
const API_KEY = 'AIzaSyBgp_1Ujzgfd7vnzh0yyN-_jEQYmj4wC20';
const SPREADSHEET_ID = '1gZya2Vpk9lbFczvycPZYcamIGhh7WE5hAEZ6NLc0VlY';
const RANGE = 'Hoja1!A2:Z';

let html5QrcodeScanner = null;

// Función para mostrar el estado
function showStatus(color, message) {
    const statusDiv = document.getElementById('status');
    const statusText = document.getElementById('status-text');
    
    if (statusDiv && statusText) {
        statusDiv.style.display = 'flex';
        statusDiv.className = `status-display ${color}`;
        statusText.innerHTML = message.replace(/\n/g, '<br>');
    } else {
        console.error('Elementos de estado no encontrados');
    }
}

// Inicializar Google Sheets API
async function initGoogleSheetsAPI() {
    try {
        await gapi.client.init({
            apiKey: API_KEY,
            discoveryDocs: ["https://sheets.googleapis.com/$discovery/rest?version=v4"],
        });
        console.log('API inicializada correctamente');
        showStatus('green', 'Sistema listo para verificar patentes');
        
        // Verificar conexión
        const testResponse = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: 'Hoja1!A1:A1'
        });
        console.log('Conexión verificada:', testResponse);
    } catch (error) {
        console.error('Error de inicialización:', error);
        showStatus('red', 'Error de conexión. Verifica tu conexión a internet y recarga la página.');
    }
}

// Cargar la API de Google
function loadGoogleAPI() {
    gapi.load('client', initGoogleSheetsAPI);
}

// Verificar estado del vehículo
async function checkVehicleStatus(plate) {
    if (!plate) {
        showStatus('red', 'Debe ingresar una patente');
        return;
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
        showStatus('red', 'Error al consultar la planilla. Verifica tu conexión a internet.');
    }
}

// Verificar patente desde input
function checkPlate() {
    const plateInput = document.getElementById('plate-input');
    if (!plateInput) {
        console.error('Input de patente no encontrado');
        return;
    }
    
    const plate = plateInput.value.trim().toUpperCase();
    console.log('Verificando patente:', plate);
    
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
    if (!qrReader) {
        console.error('Elemento QR reader no encontrado');
        return;
    }

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
    const checkButton = document.getElementById('check-button');
    const scanButton = document.getElementById('scan-button');

    if (plateInput) {
        plateInput.addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
                checkPlate();
            }
        });
    }

    if (checkButton) {
        checkButton.addEventListener('click', checkPlate);
    }

    if (scanButton) {
        scanButton.addEventListener('click', startScanner);
    }
});

// Manejador de errores global
window.addEventListener('error', function(event) {
    console.error('Error global:', event.error);
    showStatus('red', 'Error en la aplicación. Por favor, recarga la página.');
});

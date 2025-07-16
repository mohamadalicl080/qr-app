// ... (código anterior sin cambios hasta la función checkVehicleStatus)

async function checkVehicleStatus(plate) {
    if (!plate) {
        showStatus('red', 'Debe ingresar una patente');
        return;
    }

    if (!isApiReady) {
        showStatus('yellow', 'El sistema está iniciando, por favor espere unos segundos...');
        return;
    }

    showLoading();

    try {
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: SPREADSHEET_ID,
            range: RANGE,
        });

        const rows = response.result.values;
        const normalizedPlate = plate.trim().toUpperCase();

        const match = rows.find(row => row[0] && row[0].trim().toUpperCase() === normalizedPlate);

        if (match) {
            // Obtener el estado (última columna)
            const estado = match[match.length - 1]?.trim().toLowerCase();
            
            // Contar meses pagados (verdes) desde la columna 2 hasta la 13
            let mesesVerdes = 0;
            for (let i = 2; i <= 13; i++) {
                if (match[i] && match[i].trim().toLowerCase() === 'verde') {
                    mesesVerdes++;
                }
            }
            
            const porcentajePagado = (mesesVerdes / 12) * 100;
            console.log(`Patente: ${normalizedPlate}, Meses verdes: ${mesesVerdes}, Porcentaje: ${porcentajePagado}%`);

            if (estado === 'verde') {
                if (porcentajePagado === 100) {
                    showStatus('green', `Autorizado: ${match[1] || 'Sin nombre'} (${normalizedPlate})`);
                } else if (porcentajePagado >= 60) {
                    showStatus('yellow', `Autorizado con deuda pendiente: ${match[1] || 'Sin nombre'} (${normalizedPlate})`);
                } else {
                    showStatus('red', `Acceso Denegado: ${match[1] || 'Sin nombre'} (${normalizedPlate})`);
                }
            } else {
                showStatus('red', `Acceso Denegado: ${match[1] || 'Sin nombre'} (${normalizedPlate})`);
            }
        } else {
            showStatus('gray', 'Patente no encontrada en el registro');
        }

    } catch (error) {
        console.error('Error al consultar la planilla:', error);
        showStatus('gray', 'Error al consultar la planilla');
    }
}

// ... (resto del código sin cambios)

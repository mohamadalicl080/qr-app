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
            // Obtener el estado de la última columna
            const estado = match[match.length - 1]?.trim().toLowerCase();
            
            // Calcular el porcentaje de meses verdes
            const totalMesesPagados = match.slice(2, 14).filter(cell => 
                cell && cell.trim().toLowerCase() === 'verde'
            ).length;
            
            const porcentajePagado = (totalMesesPagados / 12) * 100;
            console.log('Porcentaje pagado:', porcentajePagado, '%'); // Para debugging

            if (estado === 'rojo') {
                showStatus('red', `Acceso Denegado: ${match[1] || 'Sin nombre'} (${normalizedPlate})`);
            } else if (estado === 'verde' && porcentajePagado >= 60 && porcentajePagado < 100) {
                showStatus('yellow', `Autorizado con deuda pendiente: ${match[1] || 'Sin nombre'} (${normalizedPlate})`);
            } else if (estado === 'verde' && porcentajePagado === 100) {
                showStatus('green', `Autorizado: ${match[1] || 'Sin nombre'} (${normalizedPlate})`);
            } else if (estado === 'verde' && porcentajePagado < 60) {
                showStatus('red', `Acceso Denegado: ${match[1] || 'Sin nombre'} (${normalizedPlate}) - Menos del 60% de meses pagados`);
            } else {
                showStatus('gray', `Estado no reconocido para: ${match[1] || 'Sin nombre'} (${normalizedPlate})`);
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

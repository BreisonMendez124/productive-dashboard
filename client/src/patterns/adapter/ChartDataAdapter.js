/**
 * PATRÓN ESTRUCTURAL: ADAPTER
 * Adapta la estructura JSON de SQL Server al formato requerido por Recharts.
 */
export class ChartDataAdapter {
  // Adapta respuesta de /api/dashboard/slider1/diarios-por-estado
  static adaptStatusData(sqlRows) {
    if (!sqlRows || !Array.isArray(sqlRows)) return [];
    
    // Transforma [{ estado: "W", cantidad_diarios: 15 }] -> [{ name: "Pendiente (W)", value: 15 }]
    const statusMap = { 'W': 'Pendiente', 'S': 'Asignado', 'E': 'En Ejecución' };
    
    return sqlRows.map(row => ({
      name: statusMap[row.estado] || row.estado,
      value: row.cantidad_diarios
    }));
  }

  // Adapta respuesta de /api/dashboard/slider2/top
  static adaptTopOperators(sqlRows) {
    if (!sqlRows || !Array.isArray(sqlRows)) return [];
    
    return sqlRows.map(row => ({
      operador: row.usuario,
      productividad: row.score_productividad,
      lineas: row.lineas_completadas
    }));
  }
}
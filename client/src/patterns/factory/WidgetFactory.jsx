import React from 'react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

/**
 * PATRÓN CREACIONAL: FACTORY METHOD
 * Fábrica encargada de instanciar el tipo correcto de componente visual (Widget)
 */
export const WidgetFactory = {
  createChartWidget: (type, data) => {
    const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

    switch (type) {
      case 'pie-status':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                {data.map((entry, index) => <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        );

      case 'bar-productivity':
        return (
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={data}>
              <XAxis dataKey="operador" stroke="#9e9e9e" />
              <YAxis stroke="#9e9e9e" />
              <Tooltip />
              <Bar dataKey="productividad" fill="#82ca9d" />
            </BarChart>
          </ResponsiveContainer>
        );

      default:
        return <div style={{color: 'red'}}>Error: Tipo de widget no soportado</div>;
    }
  }
};
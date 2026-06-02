import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { Printer } from 'lucide-react';

export default function InvoicePage() {
  const { id } = useParams<{ id: string }>();

  const { data: inv, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => api.get(`/trips/${id}/invoice`).then((r) => r.data),
  });

  if (isLoading) return <div className="flex items-center justify-center h-64"><div className="animate-spin rounded-full h-10 w-10 border-b-2 border-zipi-500" /></div>;
  if (!inv) return null;

  return (
    <div className="min-h-screen bg-gray-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-end mb-4 print:hidden">
          <button onClick={() => window.print()} className="btn-primary flex items-center gap-2">
            <Printer size={16} /> Imprimir / Guardar PDF
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 print:shadow-none print:rounded-none" id="invoice">
          {/* Header */}
          <div className="flex items-start justify-between mb-8 pb-6 border-b border-gray-200">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="w-10 h-10 bg-zipi-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">Z</span>
                </div>
                <h1 className="text-2xl font-bold text-gray-900">Zipi</h1>
              </div>
              <p className="text-sm text-gray-500">{inv.provider.name}</p>
              <p className="text-sm text-gray-500">CUIT: {inv.provider.cuit}</p>
              <p className="text-sm text-gray-500">{inv.provider.address}</p>
            </div>
            <div className="text-right">
              <div className="bg-zipi-50 border border-zipi-200 rounded-xl px-4 py-3">
                <p className="text-xs text-zipi-500 font-medium uppercase tracking-wide">Recibo</p>
                <p className="font-mono font-bold text-gray-900 text-sm mt-0.5">{inv.invoiceNumber}</p>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                {new Date(inv.date).toLocaleDateString('es-AR', { day: '2-digit', month: 'long', year: 'numeric' })}
              </p>
            </div>
          </div>

          {/* Client + Trip info */}
          <div className="grid grid-cols-2 gap-6 mb-8">
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Cliente</p>
              <p className="font-semibold text-gray-900">{inv.client.name}</p>
              <p className="text-sm text-gray-500">{inv.client.email}</p>
              {inv.client.cuit && <p className="text-sm text-gray-500">CUIT: {inv.client.cuit}</p>}
            </div>
            <div>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Servicio</p>
              <p className="text-sm text-gray-700">🚗 Servicio de remis</p>
              {inv.trip.driverName && <p className="text-sm text-gray-500">Conductor: {inv.trip.driverName}</p>}
              {inv.trip.distanceKm && <p className="text-sm text-gray-500">Distancia: {inv.trip.distanceKm} km</p>}
            </div>
          </div>

          {/* Route */}
          <div className="bg-gray-50 rounded-xl p-4 mb-8 space-y-2">
            <div className="flex items-start gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 mt-1 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Origen</p>
                <p className="text-sm font-medium text-gray-800">{inv.trip.from}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500 mt-1 shrink-0" />
              <div>
                <p className="text-xs text-gray-400">Destino</p>
                <p className="text-sm font-medium text-gray-800">{inv.trip.to}</p>
              </div>
            </div>
          </div>

          {/* Price breakdown */}
          <table className="w-full mb-8">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2">Concepto</th>
                <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wide pb-2">Importe</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-gray-50">
                <td className="py-2 text-gray-700">Servicio de transporte</td>
                <td className="py-2 text-right text-gray-900">${inv.pricing.subtotal.toLocaleString('es-AR')}</td>
              </tr>
              <tr className="border-b border-gray-50">
                <td className="py-2 text-gray-700">IVA 21%</td>
                <td className="py-2 text-right text-gray-900">${inv.pricing.iva.toLocaleString('es-AR')}</td>
              </tr>
              {inv.pricing.surgeMultiplier > 1 && (
                <tr className="border-b border-gray-50">
                  <td className="py-2 text-amber-600">Tarifa dinámica (×{inv.pricing.surgeMultiplier})</td>
                  <td className="py-2 text-right text-amber-600">incluida</td>
                </tr>
              )}
              {inv.pricing.discountAmount > 0 && (
                <tr className="border-b border-gray-50">
                  <td className="py-2 text-green-600">Descuento ({inv.pricing.discountCode})</td>
                  <td className="py-2 text-right text-green-600">-${inv.pricing.discountAmount.toLocaleString('es-AR')}</td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-gray-300">
                <td className="pt-3 font-bold text-gray-900 text-base">Total</td>
                <td className="pt-3 text-right font-bold text-zipi-600 text-xl">
                  ${inv.pricing.total.toLocaleString('es-AR')}
                </td>
              </tr>
            </tfoot>
          </table>

          <div className="text-center text-xs text-gray-400 border-t border-gray-100 pt-4">
            <p>Zipi — Servicio de remis y logística · Buenos Aires, Argentina</p>
            <p className="mt-0.5">Este documento es un comprobante de pago no oficial a efectos fiscales.</p>
          </div>
        </div>
      </div>
    </div>
  );
}

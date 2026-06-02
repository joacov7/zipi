import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { JobStatus } from '@zipi/shared';

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  OPEN:        { label: 'Abierta',         color: 'bg-blue-100 text-blue-700' },
  QUOTED:      { label: 'Con cotizaciones', color: 'bg-amber-100 text-amber-700' },
  ACCEPTED:    { label: 'Pendiente pago',  color: 'bg-purple-100 text-purple-700' },
  IN_PROGRESS: { label: 'En progreso',     color: 'bg-green-100 text-green-700' },
  COMPLETED:   { label: 'Completada',      color: 'bg-gray-100 text-gray-600' },
  CANCELLED:   { label: 'Cancelada',       color: 'bg-red-100 text-red-600' },
  EXPIRED:     { label: 'Expirada',        color: 'bg-gray-100 text-gray-500' },
};

const JOB_STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: '💳 Pendiente de pago',
  PAID:            '✅ Pago confirmado',
  IN_PROGRESS:     '🔧 En progreso',
  COMPLETED:       '✔️ Completado',
  CANCELLED:       '❌ Cancelado',
};

export default function MyRequestsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: requests = [], isLoading } = useQuery({
    queryKey: ['my-service-requests'],
    queryFn: () => api.get('/services/requests/me').then((r) => r.data),
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['my-service-jobs'],
    queryFn: () => api.get('/services/jobs/me').then((r) => r.data),
  });

  const acceptQuote = useMutation({
    mutationFn: (quoteId: string) => api.post(`/services/quotes/${quoteId}/accept`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-service-requests'] });
      queryClient.invalidateQueries({ queryKey: ['my-service-jobs'] });
    },
  });

  const payJob = useMutation({
    mutationFn: (jobId: string) => api.post(`/services/jobs/${jobId}/pay`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-service-jobs'] }),
  });

  const completeJob = useMutation({
    mutationFn: (jobId: string) => api.post(`/services/jobs/${jobId}/complete`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-service-jobs'] }),
  });

  if (isLoading) return <div className="text-center py-20 text-gray-400">Cargando...</div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mis solicitudes</h1>
        <button onClick={() => navigate('/services')} className="btn-primary text-sm px-4 py-2">
          + Nueva
        </button>
      </div>

      {/* Active jobs */}
      {jobs.filter((j: any) => j.status !== 'COMPLETED' && j.status !== 'CANCELLED').map((job: any) => (
        <div key={job.id} className="card space-y-4 border-l-4 border-zipi-400">
          <div className="flex items-start justify-between">
            <div>
              <span className="text-xs font-semibold text-zipi-600 uppercase tracking-wide">Trabajo activo</span>
              <h3 className="font-bold text-gray-900 mt-0.5">{job.request.title}</h3>
              <p className="text-sm text-gray-500">{job.request.category.icon} {job.request.category.name}</p>
            </div>
            <span className="text-sm font-semibold text-gray-700">${job.escrowAmount.toLocaleString('es-AR')}</span>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 text-sm">
            <p className="text-gray-500 text-xs mb-1">Contratista</p>
            <p className="font-medium">{job.contractor.user.name}</p>
            {job.status !== JobStatus.PENDING_PAYMENT && (
              <p className="text-gray-500 mt-0.5">📞 {job.contractor.user.phone}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-600">{JOB_STATUS_LABEL[job.status]}</span>
            <div className="flex gap-2">
              {job.status === JobStatus.PENDING_PAYMENT && (
                <button
                  onClick={() => payJob.mutate(job.id)}
                  disabled={payJob.isPending}
                  className="btn-primary text-sm px-4 py-2"
                >
                  Confirmar pago (escrow)
                </button>
              )}
              {job.status === JobStatus.IN_PROGRESS && (
                <button
                  onClick={() => completeJob.mutate(job.id)}
                  disabled={completeJob.isPending}
                  className="bg-green-500 hover:bg-green-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors"
                >
                  Confirmar finalización
                </button>
              )}
            </div>
          </div>

          <div className="text-xs text-gray-400 bg-amber-50 rounded-lg p-2">
            💰 ${job.platformFee.toLocaleString('es-AR')} de comisión Zipi · ${job.finalAmount.toLocaleString('es-AR')} para el contratista
          </div>
        </div>
      ))}

      {/* Requests with quotes */}
      {requests.map((req: any) => {
        const badge = STATUS_LABEL[req.status] || { label: req.status, color: 'bg-gray-100 text-gray-600' };
        return (
          <div key={req.id} className="card space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{req.category.icon}</span>
                  <span className="text-xs text-gray-500">{req.category.name}</span>
                  <span className={`badge ${badge.color}`}>{badge.label}</span>
                </div>
                <h3 className="font-bold text-gray-900">{req.title}</h3>
                <p className="text-sm text-gray-500 mt-0.5">📍 {req.address}</p>
              </div>
            </div>

            {req.quotes?.length > 0 && req.status === 'QUOTED' && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">{req.quotes.length} cotización(es)</p>
                {req.quotes.map((quote: any) => (
                  <div key={quote.id} className="bg-gray-50 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold">{quote.contractor.user.name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{quote.description.slice(0, 60)}...</p>
                      {quote.estimatedHours && (
                        <p className="text-xs text-gray-400">⏱ {quote.estimatedHours}h estimadas</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-900">${quote.price.toLocaleString('es-AR')}</p>
                      <button
                        onClick={() => acceptQuote.mutate(quote.id)}
                        disabled={acceptQuote.isPending}
                        className="text-xs bg-zipi-500 hover:bg-zipi-600 text-white font-semibold px-3 py-1.5 rounded-lg mt-1 transition-colors"
                      >
                        Aceptar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {req.status === 'OPEN' && (
              <p className="text-sm text-gray-400 text-center py-2">
                Esperando cotizaciones de profesionales...
              </p>
            )}
          </div>
        );
      })}

      {requests.length === 0 && jobs.length === 0 && (
        <div className="text-center py-16 text-gray-400">
          <p className="text-4xl mb-3">🔧</p>
          <p className="font-medium">No tenés solicitudes todavía</p>
          <button onClick={() => navigate('/services')} className="btn-primary mt-4">
            Hacer una solicitud
          </button>
        </div>
      )}
    </div>
  );
}

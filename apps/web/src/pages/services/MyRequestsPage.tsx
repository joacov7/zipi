import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { JobStatus } from '@zipi/shared';
import { Plus, Wrench, MapPin, Clock, User, ChevronRight } from 'lucide-react';

const STATUS_META: Record<string, { label: string; bg: string; fg: string }> = {
  OPEN:        { label: 'Abierta',          bg: 'rgba(47,107,236,0.1)',   fg: '#2F6BEC' },
  QUOTED:      { label: 'Con cotizaciones', bg: 'rgba(239,144,8,0.1)',    fg: '#C77A00' },
  ACCEPTED:    { label: 'Pendiente pago',   bg: 'rgba(109,90,224,0.1)',   fg: '#6D5AE0' },
  IN_PROGRESS: { label: 'En progreso',      bg: 'rgba(14,158,110,0.1)',   fg: '#0E9E6E' },
  COMPLETED:   { label: 'Completada',       bg: 'rgba(163,158,149,0.1)',  fg: '#6b6760' },
  CANCELLED:   { label: 'Cancelada',        bg: 'rgba(224,62,99,0.1)',    fg: '#E03E63' },
  EXPIRED:     { label: 'Expirada',         bg: 'rgba(163,158,149,0.08)', fg: '#a39e95' },
};

const JOB_STATUS_LABEL: Record<string, string> = {
  PENDING_PAYMENT: 'Pendiente de pago',
  PAID:            'Pago confirmado',
  IN_PROGRESS:     'En progreso',
  COMPLETED:       'Completado',
  CANCELLED:       'Cancelado',
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

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-5">
          <div className="h-8 w-40 bg-zipi-surface2 rounded-[10px] animate-pulse" />
        </div>
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-36 bg-zipi-surface2 rounded-[22px] animate-pulse mb-3" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-5">
        <h1 className="text-[26px] font-extrabold text-zipi-ink tracking-tight">Mis solicitudes</h1>
        <button
          onClick={() => navigate('/services')}
          className="h-9 px-4 rounded-full bg-zipi-ink text-white font-bold text-[13px] flex items-center gap-1.5 hover:opacity-90 transition-opacity"
        >
          <Plus size={14} />
          Nueva
        </button>
      </div>

      {/* Active jobs */}
      {jobs
        .filter((j: any) => j.status !== 'COMPLETED' && j.status !== 'CANCELLED')
        .map((job: any) => (
          <div
            key={job.id}
            className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi mb-4 space-y-4"
            style={{ borderLeft: '4px solid #EF9008' }}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-[11.5px] font-bold text-zipi-500 uppercase tracking-[0.05em]">Trabajo activo</p>
                <p className="text-[16px] font-bold text-zipi-ink mt-0.5">{job.request.title}</p>
                <p className="text-[12.5px] text-zipi-muted">{job.request.category.icon} {job.request.category.name}</p>
              </div>
              <p className="text-[18px] font-extrabold text-zipi-ink">${job.escrowAmount.toLocaleString('es-AR')}</p>
            </div>

            <div className="bg-zipi-surface2 rounded-[13px] p-3">
              <p className="text-[11px] text-zipi-faint mb-1">Contratista</p>
              <div className="flex items-center gap-2">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-bold text-white text-[12px] shrink-0"
                  style={{ background: 'linear-gradient(135deg,#EF9008,#D46A04)' }}
                >
                  {job.contractor.user.name.charAt(0)}
                </div>
                <div>
                  <p className="text-[13.5px] font-semibold text-zipi-ink">{job.contractor.user.name}</p>
                  {job.status !== JobStatus.PENDING_PAYMENT && (
                    <p className="text-[12px] text-zipi-muted">{job.contractor.user.phone}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-[13px] font-semibold text-zipi-muted">{JOB_STATUS_LABEL[job.status]}</span>
              <div className="flex gap-2">
                {job.status === JobStatus.PENDING_PAYMENT && (
                  <button
                    onClick={() => payJob.mutate(job.id)}
                    disabled={payJob.isPending}
                    className="h-[40px] px-4 rounded-[12px] font-bold text-white text-[13px] disabled:opacity-50"
                    style={{ background: '#1A1714' }}
                  >
                    Confirmar pago (escrow)
                  </button>
                )}
                {job.status === JobStatus.IN_PROGRESS && (
                  <button
                    onClick={() => completeJob.mutate(job.id)}
                    disabled={completeJob.isPending}
                    className="h-[40px] px-4 rounded-[12px] font-bold text-white text-[13px] disabled:opacity-50"
                    style={{ background: '#0E9E6E' }}
                  >
                    Confirmar finalización
                  </button>
                )}
              </div>
            </div>

            <div
              className="rounded-[10px] p-2.5 text-[12px] text-zipi-muted"
              style={{ background: 'rgba(239,144,8,0.07)' }}
            >
              ${job.platformFee.toLocaleString('es-AR')} comisión Zipi · ${job.finalAmount.toLocaleString('es-AR')} para el contratista
            </div>
          </div>
        ))}

      {/* Requests */}
      {requests.map((req: any) => {
        const meta = STATUS_META[req.status] ?? { label: req.status, bg: 'rgba(163,158,149,0.1)', fg: '#6b6760' };
        return (
          <div key={req.id} className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi mb-3.5 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-[22px] mt-0.5 shrink-0">{req.category.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <span className="text-[11px] text-zipi-faint">{req.category.name}</span>
                  <span
                    className="text-[11px] font-bold px-2 py-0.5 rounded-full"
                    style={{ background: meta.bg, color: meta.fg }}
                  >
                    {meta.label}
                  </span>
                </div>
                <p className="text-[15px] font-bold text-zipi-ink">{req.title}</p>
                <p className="text-[12.5px] text-zipi-muted flex items-center gap-1 mt-0.5">
                  <MapPin size={11} /> {req.address}
                </p>
              </div>
            </div>

            {req.quotes?.length > 0 && req.status === 'QUOTED' && (
              <div className="space-y-2">
                <p className="text-[12.5px] font-bold text-zipi-ink">{req.quotes.length} cotización(es)</p>
                {req.quotes.map((quote: any) => (
                  <div
                    key={quote.id}
                    className="bg-zipi-surface2 rounded-[13px] p-3 flex items-center justify-between gap-3"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-bold text-zipi-ink">{quote.contractor.user.name}</p>
                      <p className="text-[12px] text-zipi-muted truncate mt-0.5">{quote.description.slice(0, 60)}...</p>
                      {quote.estimatedHours && (
                        <p className="text-[11.5px] text-zipi-faint flex items-center gap-1 mt-0.5">
                          <Clock size={11} /> {quote.estimatedHours}h estimadas
                        </p>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-[16px] font-extrabold text-zipi-ink">${quote.price.toLocaleString('es-AR')}</p>
                      <button
                        onClick={() => acceptQuote.mutate(quote.id)}
                        disabled={acceptQuote.isPending}
                        className="h-8 px-3 rounded-[9px] text-[12px] font-bold text-white mt-1 disabled:opacity-50 transition-opacity"
                        style={{ background: '#0E9E6E' }}
                      >
                        Aceptar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {req.status === 'OPEN' && (
              <p className="text-[13px] text-zipi-faint text-center py-1.5">
                Esperando cotizaciones de profesionales...
              </p>
            )}
          </div>
        );
      })}

      {requests.length === 0 && jobs.length === 0 && (
        <div className="text-center py-16">
          <div
            className="w-16 h-16 rounded-[20px] flex items-center justify-center mx-auto mb-4"
            style={{ background: 'rgba(109,90,224,0.1)' }}
          >
            <Wrench size={28} style={{ color: '#6D5AE0' }} strokeWidth={1.6} />
          </div>
          <p className="text-[15px] font-bold text-zipi-muted">No tenés solicitudes todavía</p>
          <button
            onClick={() => navigate('/services')}
            className="mt-4 h-[50px] px-8 rounded-2xl font-bold text-white"
            style={{ background: '#1A1714' }}
          >
            Hacer una solicitud
          </button>
        </div>
      )}
    </div>
  );
}

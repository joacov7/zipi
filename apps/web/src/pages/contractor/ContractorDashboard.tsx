import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';
import { DuoIcon } from '../../components/ui/DuoIcon';

function getCategoryIcon(name: string): string | null {
  const lower = name.toLowerCase();
  if (lower.includes('plom')) return 'wrench';
  if (lower.includes('electric')) return 'bolt';
  if (lower.includes('pintu') || lower.includes('pintor')) return 'roller';
  if (lower.includes('cerr')) return 'key';
  if (lower.includes('gas') || lower.includes('gasist')) return 'flame';
  if (lower.includes('aire') || lower.includes('climat')) return 'wind';
  if (lower.includes('carpint')) return 'hammer';
  if (lower.includes('jardin') || lower.includes('paisaj')) return 'leaf';
  return null;
}

const JOB_STATUS_LABELS: Record<string, { label: string; bg: string; fg: string }> = {
  PENDING_PAYMENT: { label: 'Esperando pago', bg: 'rgba(245,166,35,0.12)', fg: '#C77A00' },
  PAID:            { label: 'Listo para iniciar', bg: 'rgba(47,107,236,0.12)', fg: '#2F6BEC' },
  IN_PROGRESS:     { label: 'En progreso', bg: 'rgba(14,158,110,0.12)', fg: '#0E9E6E' },
  COMPLETED:       { label: 'Completado', bg: 'rgba(163,158,149,0.12)', fg: '#6b6760' },
  CANCELLED:       { label: 'Cancelado', bg: 'rgba(224,62,99,0.12)', fg: '#E03E63' },
};

export default function ContractorDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [quotingId, setQuotingId] = useState<string | null>(null);
  const [quoteForm, setQuoteForm] = useState({ price: '', description: '', estimatedHours: '' });
  const [tab, setTab] = useState<'open' | 'jobs'>('open');

  const { data: profile, isLoading } = useQuery({
    queryKey: ['contractor-profile'],
    queryFn: () => api.get('/services/contractor/me').then((r) => r.data),
  });

  const { data: openRequests = [] } = useQuery({
    queryKey: ['contractor-open-requests'],
    queryFn: () => api.get('/services/requests/contractor').then((r) => r.data),
    enabled: !!profile,
    refetchInterval: 15000,
  });

  const { data: jobs = [] } = useQuery({
    queryKey: ['my-service-jobs'],
    queryFn: () => api.get('/services/jobs/me').then((r) => r.data),
    enabled: !!profile,
  });

  const toggleAvailability = useMutation({
    mutationFn: (isAvailable: boolean) =>
      api.patch('/services/contractor/availability', { isAvailable }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['contractor-profile'] }),
  });

  const submitQuote = useMutation({
    mutationFn: ({ requestId, ...data }: any) =>
      api.post(`/services/requests/${requestId}/quotes`, {
        price: Number(data.price),
        description: data.description,
        estimatedHours: data.estimatedHours ? Number(data.estimatedHours) : undefined,
      }),
    onSuccess: () => {
      setQuotingId(null);
      setQuoteForm({ price: '', description: '', estimatedHours: '' });
      queryClient.invalidateQueries({ queryKey: ['contractor-open-requests'] });
    },
  });

  const startJob = useMutation({
    mutationFn: (jobId: string) => api.patch(`/services/jobs/${jobId}/start`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['my-service-jobs'] }),
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-zipi-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4">
        <div
          className="w-[72px] h-[72px] rounded-[22px] flex items-center justify-center mx-auto"
          style={{ background: 'rgba(109,90,224,0.12)', color: '#6D5AE0' }}
        >
          <DuoIcon name="wrench" size={36} stroke={1.8} />
        </div>
        <h2 className="text-[20px] font-extrabold text-zipi-ink tracking-tight">
          Configurá tu perfil de contratista
        </h2>
        <p className="text-[14px] text-zipi-muted">
          Registrá tus servicios y empezá a recibir solicitudes
        </p>
        <button
          onClick={() => navigate('/contractor/profile')}
          className="h-[54px] px-8 rounded-2xl font-bold text-[15px] text-white hover:opacity-90 transition-opacity"
          style={{ background: '#6D5AE0' }}
        >
          Crear perfil
        </button>
      </div>
    );
  }

  const activeJobs = (jobs as any[]).filter(
    (j) => !['COMPLETED', 'CANCELLED'].includes(j.status)
  );

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      {/* Header card */}
      <div className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-[17px] font-bold text-zipi-ink tracking-tight">Panel Contratista</h2>
            <p className="text-[13px] text-zipi-muted mt-0.5">
              {(profile.services as any[]).map((s) => s.category.name).join(' · ')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span
              className="text-[13px] font-semibold"
              style={{ color: profile.isAvailable ? '#0E9E6E' : '#a39e95' }}
            >
              {profile.isAvailable ? 'Disponible' : 'No disponible'}
            </span>
            <button
              onClick={() => toggleAvailability.mutate(!profile.isAvailable)}
              className="relative inline-flex h-6 w-11 items-center rounded-full transition-colors"
              style={{ background: profile.isAvailable ? '#0E9E6E' : '#ebe7df' }}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                  profile.isAvailable ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        {!profile.isVerified && (
          <div
            className="mt-3 rounded-[13px] p-3 text-[12px] font-medium"
            style={{
              background: 'rgba(245,166,35,0.12)',
              border: '1px solid rgba(245,166,35,0.35)',
              color: '#C77A00',
            }}
          >
            Tu perfil está pendiente de verificación. Podrás aceptar trabajos una vez verificado.
          </div>
        )}

        <div className="flex gap-5 mt-3.5">
          <div className="flex items-center gap-1.5">
            <span style={{ color: '#F5A623' }}>
              <DuoIcon name="star" size={14} />
            </span>
            <span className="text-[13.5px] font-bold text-zipi-ink">{profile.rating.toFixed(1)}</span>
            <span className="text-[12.5px] text-zipi-faint">rating</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span style={{ color: '#0E9E6E' }}>
              <DuoIcon name="check" size={14} />
            </span>
            <span className="text-[13.5px] font-bold text-zipi-ink">{profile.totalJobs}</span>
            <span className="text-[12.5px] text-zipi-faint">trabajos</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-zipi-surface2 rounded-[16px] p-1 gap-1">
        <button
          onClick={() => setTab('open')}
          className={`flex-1 py-2.5 rounded-[13px] text-[13.5px] font-bold transition-all ${
            tab === 'open' ? 'bg-white text-zipi-ink shadow-zipi' : 'text-zipi-muted'
          }`}
        >
          Solicitudes ({(openRequests as any[]).length})
        </button>
        <button
          onClick={() => setTab('jobs')}
          className={`flex-1 py-2.5 rounded-[13px] text-[13.5px] font-bold transition-all ${
            tab === 'jobs' ? 'bg-white text-zipi-ink shadow-zipi' : 'text-zipi-muted'
          }`}
        >
          Mis trabajos ({activeJobs.length})
        </button>
      </div>

      {/* Open requests */}
      {tab === 'open' && (
        <div className="space-y-3.5">
          {(openRequests as any[]).length === 0 && (
            <div className="text-center py-10">
              <div className="mx-auto mb-3 w-fit opacity-50" style={{ color: '#a39e95' }}>
                <DuoIcon name="briefcase" size={40} stroke={1.6} fillOpacity={0.1} />
              </div>
              <p className="text-[15px] font-bold text-zipi-muted">No hay solicitudes abiertas</p>
              <p className="text-[13px] text-zipi-faint mt-1">Volvé a revisar en unos minutos</p>
            </div>
          )}
          {(openRequests as any[]).map((req) => {
            const iconName = getCategoryIcon(req.category.name);
            return (
              <div
                key={req.id}
                className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi space-y-3.5"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-[46px] h-[46px] rounded-[13px] flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(109,90,224,0.12)', color: '#6D5AE0' }}
                  >
                    {iconName ? (
                      <DuoIcon name={iconName} size={22} stroke={2} />
                    ) : (
                      <span className="text-xl leading-none">{req.category.icon}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[12px] font-semibold text-zipi-faint">
                        {req.category.name}
                      </span>
                      {req.urgency === 'URGENT' && (
                        <span
                          className="text-[11px] font-bold rounded-full px-2 py-0.5"
                          style={{ background: 'rgba(224,62,99,0.12)', color: '#E03E63' }}
                        >
                          Urgente
                        </span>
                      )}
                    </div>
                    <h3 className="text-[15px] font-bold text-zipi-ink">{req.title}</h3>
                    <p className="text-[12.5px] text-zipi-muted mt-0.5">{req.address}</p>
                  </div>
                  <span className="text-[12px] text-zipi-faint shrink-0">{req._count.quotes} cot.</span>
                </div>

                {req.description && (
                  <p className="text-[13.5px] text-zipi-muted leading-relaxed">{req.description}</p>
                )}

                {quotingId === req.id ? (
                  <div className="space-y-3 bg-zipi-surface2 rounded-[16px] p-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[12px] font-bold text-zipi-ink mb-1.5 block">
                          Precio ($)
                        </label>
                        <input
                          type="number"
                          className="input text-sm"
                          placeholder="15000"
                          value={quoteForm.price}
                          onChange={(e) => setQuoteForm({ ...quoteForm, price: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className="text-[12px] font-bold text-zipi-ink mb-1.5 block">
                          Horas estimadas
                        </label>
                        <input
                          type="number"
                          className="input text-sm"
                          placeholder="2"
                          value={quoteForm.estimatedHours}
                          onChange={(e) =>
                            setQuoteForm({ ...quoteForm, estimatedHours: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[12px] font-bold text-zipi-ink mb-1.5 block">
                        Descripción de tu propuesta
                      </label>
                      <textarea
                        className="input text-sm resize-none"
                        rows={2}
                        placeholder="Contá cómo resolverías el problema..."
                        value={quoteForm.description}
                        onChange={(e) =>
                          setQuoteForm({ ...quoteForm, description: e.target.value })
                        }
                      />
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => submitQuote.mutate({ requestId: req.id, ...quoteForm })}
                        disabled={
                          submitQuote.isPending || !quoteForm.price || !quoteForm.description
                        }
                        className="flex-1 h-[46px] rounded-2xl font-bold text-[14px] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                        style={{ background: '#6D5AE0' }}
                      >
                        {submitQuote.isPending ? 'Enviando...' : 'Enviar cotización'}
                      </button>
                      <button
                        onClick={() => setQuotingId(null)}
                        className="h-[46px] px-5 rounded-2xl font-bold text-[14px] border border-zipi-rim text-zipi-muted hover:bg-zipi-surface2 transition-colors"
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setQuotingId(req.id)}
                    className="w-full h-[46px] rounded-2xl font-bold text-[14px] text-white hover:opacity-90 transition-opacity"
                    style={{ background: '#6D5AE0' }}
                  >
                    Cotizar
                  </button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* My jobs */}
      {tab === 'jobs' && (
        <div className="space-y-3.5">
          {(jobs as any[]).length === 0 && (
            <div className="text-center py-10">
              <div className="mx-auto mb-3 w-fit opacity-50" style={{ color: '#a39e95' }}>
                <DuoIcon name="briefcase" size={40} stroke={1.6} fillOpacity={0.1} />
              </div>
              <p className="text-[15px] font-bold text-zipi-muted">No tenés trabajos todavía</p>
            </div>
          )}
          {(jobs as any[]).map((job) => {
            const iconName = getCategoryIcon(job.request.category.name);
            const statusMeta = JOB_STATUS_LABELS[job.status] ?? JOB_STATUS_LABELS.PENDING_PAYMENT;
            return (
              <div
                key={job.id}
                className="bg-white border border-zipi-rim rounded-[22px] p-[18px] shadow-zipi space-y-3.5"
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-[46px] h-[46px] rounded-[13px] flex items-center justify-center shrink-0"
                    style={{ background: 'rgba(109,90,224,0.12)', color: '#6D5AE0' }}
                  >
                    {iconName ? (
                      <DuoIcon name={iconName} size={22} stroke={2} />
                    ) : (
                      <span className="text-xl leading-none">{job.request.category.icon}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-semibold text-zipi-faint mb-0.5">
                      {job.request.category.name}
                    </p>
                    <h3 className="text-[15px] font-bold text-zipi-ink">{job.request.title}</h3>
                    <p className="text-[12.5px] text-zipi-muted">{job.client.name}</p>
                  </div>
                  <span className="text-[17px] font-extrabold text-zipi-ink tracking-tight shrink-0">
                    ${job.finalAmount.toLocaleString('es-AR')}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className="text-[11.5px] font-bold rounded-full px-3 py-1"
                    style={{ background: statusMeta.bg, color: statusMeta.fg }}
                  >
                    {statusMeta.label}
                  </span>
                  {job.status === 'PAID' && (
                    <button
                      onClick={() => startJob.mutate(job.id)}
                      disabled={startJob.isPending}
                      className="h-[40px] px-5 rounded-2xl font-bold text-[13.5px] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
                      style={{ background: '#0E9E6E' }}
                    >
                      {startJob.isPending ? 'Iniciando...' : 'Iniciar trabajo'}
                    </button>
                  )}
                </div>

                {job.status === 'PENDING_PAYMENT' && (
                  <div
                    className="rounded-[13px] p-3 text-[12.5px] font-medium"
                    style={{
                      background: 'rgba(245,166,35,0.12)',
                      border: '1px solid rgba(245,166,35,0.3)',
                      color: '#C77A00',
                    }}
                  >
                    Esperando que el cliente confirme el pago
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

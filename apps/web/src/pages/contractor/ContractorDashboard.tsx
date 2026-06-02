import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '../../lib/api';

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

  if (isLoading) return <div className="text-center py-20 text-gray-400">Cargando...</div>;

  if (!profile) {
    return (
      <div className="max-w-lg mx-auto text-center py-16 space-y-4">
        <p className="text-5xl">🔧</p>
        <h2 className="text-xl font-bold text-gray-900">Configurá tu perfil de contratista</h2>
        <button onClick={() => navigate('/contractor/profile')} className="btn-primary">
          Crear perfil
        </button>
      </div>
    );
  }

  const activeJobs = jobs.filter((j: any) => !['COMPLETED', 'CANCELLED'].includes(j.status));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-bold text-gray-900 text-lg">Panel Contratista</h2>
            <p className="text-sm text-gray-500">
              {profile.services.map((s: any) => s.category.name).join(' · ')}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`text-sm font-medium ${profile.isAvailable ? 'text-green-600' : 'text-gray-400'}`}>
              {profile.isAvailable ? '🟢 Disponible' : '🔴 No disponible'}
            </span>
            <button
              onClick={() => toggleAvailability.mutate(!profile.isAvailable)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                profile.isAvailable ? 'bg-green-400' : 'bg-gray-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                profile.isAvailable ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>
        </div>
        {!profile.isVerified && (
          <div className="mt-3 bg-amber-50 border border-amber-200 rounded-lg p-2 text-xs text-amber-700">
            Tu perfil está pendiente de verificación. Podrás aceptar trabajos una vez verificado.
          </div>
        )}
        <div className="flex gap-4 mt-3 text-sm text-gray-500">
          <span>⭐ {profile.rating.toFixed(1)}</span>
          <span>✅ {profile.totalJobs} trabajos</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setTab('open')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
            tab === 'open' ? 'bg-zipi-500 text-white border-zipi-500' : 'border-gray-200 text-gray-600'
          }`}
        >
          Solicitudes abiertas ({openRequests.length})
        </button>
        <button
          onClick={() => setTab('jobs')}
          className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-colors ${
            tab === 'jobs' ? 'bg-zipi-500 text-white border-zipi-500' : 'border-gray-200 text-gray-600'
          }`}
        >
          Mis trabajos ({activeJobs.length})
        </button>
      </div>

      {/* Open requests */}
      {tab === 'open' && (
        <div className="space-y-4">
          {openRequests.length === 0 && (
            <p className="text-center text-gray-400 py-10">No hay solicitudes abiertas ahora</p>
          )}
          {openRequests.map((req: any) => (
            <div key={req.id} className="card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span>{req.category.icon}</span>
                    <span className="text-xs text-gray-500">{req.category.name}</span>
                    {req.urgency === 'URGENT' && (
                      <span className="badge bg-red-100 text-red-600">🚨 Urgente</span>
                    )}
                  </div>
                  <h3 className="font-bold text-gray-900 mt-1">{req.title}</h3>
                  <p className="text-sm text-gray-500">📍 {req.address}</p>
                </div>
                <span className="text-xs text-gray-400">{req._count.quotes} cot.</span>
              </div>
              <p className="text-sm text-gray-600">{req.description}</p>

              {quotingId === req.id ? (
                <div className="space-y-3 bg-gray-50 rounded-xl p-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Precio ($)</label>
                      <input
                        type="number"
                        className="input text-sm"
                        placeholder="15000"
                        value={quoteForm.price}
                        onChange={(e) => setQuoteForm({ ...quoteForm, price: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-600 mb-1 block">Horas estimadas</label>
                      <input
                        type="number"
                        className="input text-sm"
                        placeholder="2"
                        value={quoteForm.estimatedHours}
                        onChange={(e) => setQuoteForm({ ...quoteForm, estimatedHours: e.target.value })}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600 mb-1 block">Descripción de tu propuesta</label>
                    <textarea
                      className="input text-sm resize-none"
                      rows={2}
                      placeholder="Contá cómo resolverías el problema..."
                      value={quoteForm.description}
                      onChange={(e) => setQuoteForm({ ...quoteForm, description: e.target.value })}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => submitQuote.mutate({ requestId: req.id, ...quoteForm })}
                      disabled={submitQuote.isPending || !quoteForm.price || !quoteForm.description}
                      className="btn-primary flex-1 text-sm py-2"
                    >
                      {submitQuote.isPending ? 'Enviando...' : 'Enviar cotización'}
                    </button>
                    <button
                      onClick={() => setQuotingId(null)}
                      className="btn-secondary text-sm py-2 px-4"
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setQuotingId(req.id)}
                  className="btn-primary w-full text-sm py-2"
                >
                  Cotizar
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* My jobs */}
      {tab === 'jobs' && (
        <div className="space-y-4">
          {jobs.length === 0 && (
            <p className="text-center text-gray-400 py-10">No tenés trabajos todavía</p>
          )}
          {jobs.map((job: any) => (
            <div key={job.id} className="card space-y-3">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-gray-500">{job.request.category.icon} {job.request.category.name}</p>
                  <h3 className="font-bold text-gray-900">{job.request.title}</h3>
                  <p className="text-sm text-gray-500">👤 {job.client.name}</p>
                </div>
                <span className="font-bold text-gray-900">${job.finalAmount.toLocaleString('es-AR')}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">{job.status}</span>
                {job.status === 'PAID' && (
                  <button
                    onClick={() => startJob.mutate(job.id)}
                    disabled={startJob.isPending}
                    className="btn-primary text-sm py-2 px-4"
                  >
                    Iniciar trabajo
                  </button>
                )}
              </div>
              {job.status === 'PENDING_PAYMENT' && (
                <p className="text-xs text-amber-600 bg-amber-50 rounded-lg p-2">
                  ⏳ Esperando que el cliente confirme el pago
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

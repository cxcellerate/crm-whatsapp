import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserPlus, Pencil, ToggleLeft, ToggleRight, Shield, Users } from 'lucide-react';
import { api } from '../services/api';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { useForm } from 'react-hook-form';
import { User } from '../types';
import toast from 'react-hot-toast';

interface InviteForm {
  name: string;
  email: string;
  password: string;
  role: string;
}

export function UsersPage() {
  const [inviteOpen, setInviteOpen] = useState(false);
  const qc = useQueryClient();

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => api.get('/users').then((r) => r.data),
  });

  const invite = useMutation({
    mutationFn: (data: InviteForm) => api.post('/auth/register', data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['users'] });
      toast.success('Usuário criado com sucesso!');
      setInviteOpen(false);
      reset();
    },
    onError: () => toast.error('Erro ao criar usuário. Email já cadastrado?'),
  });

  const toggleActive = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      api.put(`/users/${id}`, { active }).then((r) => r.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const { register, handleSubmit, reset, formState: { errors } } = useForm<InviteForm>({
    defaultValues: { role: 'SELLER' },
  });

  const ROLE_COLORS: Record<string, string> = {
    ADMIN: 'bg-brand-500/20 text-brand-400',
    MANAGER: 'bg-blue-500/20 text-blue-400',
    SELLER: 'bg-dark-600 text-dark-300',
  };
  const ROLE_LABELS: Record<string, string> = {
    ADMIN: 'Administrador', MANAGER: 'Gerente', SELLER: 'Vendedor',
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-dark-50">Equipe</h1>
        <button className="btn-primary" onClick={() => setInviteOpen(true)}>
          <UserPlus size={16} /> Novo Usuário
        </button>
      </div>

      {users.length === 0 ? (
        <EmptyState icon={Users} title="Nenhum usuário" description="Convide membros para sua equipe" action={<button className="btn-primary" onClick={() => setInviteOpen(true)}><UserPlus size={16} /> Novo Usuário</button>} />
      ) : (
        <div className="space-y-2">
          {users.map((user: User) => (
            <div key={user.id} className={`card p-4 flex items-center gap-4 transition-opacity ${!user.active ? 'opacity-60' : ''}`}>
              {/* Avatar */}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center text-lg font-bold shrink-0 ${user.active ? 'bg-brand-500/20 text-brand-400' : 'bg-dark-700 text-dark-500'}`}>
                {user.name[0].toUpperCase()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-dark-100">{user.name}</p>
                  {user.role === 'ADMIN' && <Shield size={13} className="text-brand-400" />}
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[user.role]}`}>
                    {ROLE_LABELS[user.role]}
                  </span>
                  {!user.active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-500/10 text-red-400">Inativo</span>}
                </div>
                <p className="text-dark-500 text-sm mt-0.5 truncate">{user.email}</p>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleActive.mutate({ id: user.id, active: !user.active })}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${user.active ? 'hover:bg-red-500/10 text-dark-400 hover:text-red-400' : 'hover:bg-green-500/10 text-dark-500 hover:text-green-400'}`}
                  title={user.active ? 'Desativar' : 'Ativar'}
                >
                  {user.active ? <ToggleRight size={16} /> : <ToggleLeft size={16} />}
                  {user.active ? 'Ativo' : 'Inativo'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Stats */}
      {users.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total', value: users.length, color: 'text-dark-200' },
            { label: 'Ativos', value: users.filter((u: User) => u.active).length, color: 'text-green-400' },
            { label: 'Inativos', value: users.filter((u: User) => !u.active).length, color: 'text-red-400' },
          ].map(({ label, value, color }) => (
            <div key={label} className="card p-4 text-center">
              <p className={`text-2xl font-bold ${color}`}>{value}</p>
              <p className="text-dark-500 text-sm">{label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Modal criar usuário */}
      <Modal open={inviteOpen} onClose={() => { setInviteOpen(false); reset(); }} title="Novo Usuário" size="sm">
        <form onSubmit={handleSubmit((d) => invite.mutate(d))} className="space-y-4">
          <div>
            <label className="label">Nome completo *</label>
            <input className="input" placeholder="Nome do usuário" {...register('name', { required: true })} />
            {errors.name && <p className="text-red-400 text-xs mt-1">Nome obrigatório</p>}
          </div>
          <div>
            <label className="label">Email *</label>
            <input className="input" type="email" placeholder="email@empresa.com" {...register('email', { required: true })} />
            {errors.email && <p className="text-red-400 text-xs mt-1">Email obrigatório</p>}
          </div>
          <div>
            <label className="label">Senha inicial *</label>
            <input className="input" type="password" placeholder="Mínimo 6 caracteres" {...register('password', { required: true, minLength: 6 })} />
            {errors.password && <p className="text-red-400 text-xs mt-1">Senha mínima de 6 caracteres</p>}
          </div>
          <div>
            <label className="label">Perfil</label>
            <select className="input" {...register('role')}>
              <option value="SELLER">Vendedor</option>
              <option value="MANAGER">Gerente</option>
              <option value="ADMIN">Administrador</option>
            </select>
          </div>
          <div className="flex gap-3 justify-end pt-1">
            <button type="button" className="btn-secondary" onClick={() => { setInviteOpen(false); reset(); }}>Cancelar</button>
            <button type="submit" className="btn-primary" disabled={invite.isPending}>
              {invite.isPending ? 'Criando...' : 'Criar usuário'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

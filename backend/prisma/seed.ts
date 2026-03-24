import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed...');

  // Admin
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@crmwhatsapp.com' },
    update: {},
    create: {
      name: 'Administrador',
      email: 'admin@crmwhatsapp.com',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  // Vendedor
  const sellerPassword = await bcrypt.hash('seller123', 10);
  const seller = await prisma.user.upsert({
    where: { email: 'vendedor@crmwhatsapp.com' },
    update: {},
    create: {
      name: 'João Vendedor',
      email: 'vendedor@crmwhatsapp.com',
      password: sellerPassword,
      role: 'SELLER',
    },
  });

  // Pipeline principal
  const pipeline = await prisma.pipeline.upsert({
    where: { id: 'pipeline-principal' },
    update: {},
    create: {
      id: 'pipeline-principal',
      name: 'Funil de Vendas',
      color: '#f59f0a',
      order: 0,
    },
  });

  // Etapas
  const stagesData = [
    { name: 'Novo Lead', color: '#6366f1', order: 0 },
    { name: 'Contato feito', color: '#3b82f6', order: 1 },
    { name: 'Proposta enviada', color: '#f59e0b', order: 2 },
    { name: 'Negociação', color: '#f97316', order: 3 },
    { name: 'Ganho', color: '#22c55e', order: 4 },
    { name: 'Perdido', color: '#ef4444', order: 5 },
  ];

  const stages: any[] = [];
  for (const s of stagesData) {
    const stage = await prisma.stage.upsert({
      where: { id: `stage-${s.order}` },
      update: {},
      create: { id: `stage-${s.order}`, ...s, pipelineId: pipeline.id },
    });
    stages.push(stage);
  }

  // Leads de exemplo
  const leadsData = [
    { name: 'Maria Silva', phone: '11991234567', email: 'maria@empresa.com.br', company: 'Empresa ABC', value: 2500, source: 'GOOGLE_ADS', stageIndex: 0 },
    { name: 'Pedro Santos', phone: '11987654321', email: 'pedro@negocio.com', company: 'Negócio XYZ', value: 5000, source: 'META_ADS', stageIndex: 1 },
    { name: 'Ana Costa', phone: '11999998888', email: 'ana@startup.io', company: 'Startup Tech', value: 12000, source: 'ORGANIC', stageIndex: 2 },
    { name: 'Carlos Souza', phone: '11955557777', company: 'Comércio Local', value: 800, source: 'WHATSAPP', stageIndex: 0 },
    { name: 'Julia Ferreira', phone: '11944446666', email: 'julia@corp.com', company: 'Corp S/A', value: 30000, source: 'REFERRAL', stageIndex: 3 },
  ];

  for (const l of leadsData) {
    const { stageIndex, ...leadData } = l;
    await prisma.lead.create({
      data: {
        ...leadData,
        stageId: stages[stageIndex].id,
        assignedTo: seller.id,
        tags: ['exemplo'],
      },
    });
  }

  // Form de captura exemplo
  await prisma.formCapture.upsert({
    where: { token: 'token-exemplo-form' },
    update: {},
    create: {
      name: 'Formulário do Site',
      token: 'token-exemplo-form',
      stageId: stages[0].id,
      assignTo: seller.id,
      active: true,
    },
  });

  console.log('✅ Seed concluído!');
  console.log('');
  console.log('👤 Credenciais:');
  console.log('  Admin:    admin@crmwhatsapp.com / admin123');
  console.log('  Vendedor: vendedor@crmwhatsapp.com / seller123');
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

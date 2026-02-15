import pkg from "../src/generated/prisma/client.ts";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";
import "dotenv/config";

const { PrismaClient } = pkg;
const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  const hashedPassword = await bcrypt.hash("admin123", 12);

  await prisma.user.upsert({
    where: { email: "admin@crmwb.it" },
    update: {},
    create: {
      email: "admin@crmwb.it",
      name: "Admin",
      password: hashedPassword,
    },
  });

  console.log("Seed completato: utente admin@crmwb.it / admin123");

  // --- Sample Clients ---
  const client1 = await prisma.client.upsert({
    where: { id: "seed-client-1" },
    update: {},
    create: {
      id: "seed-client-1",
      name: "Acme Corp",
      email: "info@acmecorp.com",
      phone: "+39 02 1234567",
      company: "Acme Corporation",
      status: "ACTIVE",
    },
  });

  const client2 = await prisma.client.upsert({
    where: { id: "seed-client-2" },
    update: {},
    create: {
      id: "seed-client-2",
      name: "Rossi & Partners",
      email: "studio@rossipartners.it",
      phone: "+39 06 7654321",
      company: "Studio Rossi",
      status: "ACTIVE",
    },
  });

  console.log("Seed: 2 clienti creati");

  // --- Sample Projects ---
  const project1 = await prisma.project.upsert({
    where: { id: "seed-project-1" },
    update: {},
    create: {
      id: "seed-project-1",
      name: "Redesign Sito Web",
      description: "Redesign completo del sito web aziendale con nuovo branding",
      status: "IN_PROGRESS",
      startDate: new Date("2025-01-15"),
      budget: 12000,
      hourlyRate: 75,
      clientId: client1.id,
    },
  });

  const project2 = await prisma.project.upsert({
    where: { id: "seed-project-2" },
    update: {},
    create: {
      id: "seed-project-2",
      name: "App Mobile E-Commerce",
      description: "Sviluppo app mobile per e-commerce con React Native",
      status: "IN_PROGRESS",
      startDate: new Date("2025-02-01"),
      budget: 25000,
      hourlyRate: 85,
      clientId: client2.id,
    },
  });

  console.log("Seed: 2 progetti creati");

  // --- Sample Tasks for Project 1 ---
  const tasksProject1 = [
    { id: "seed-task-01", title: "Wireframe homepage", description: "Creare wireframe per la nuova homepage", status: "DONE", priority: "HIGH" },
    { id: "seed-task-02", title: "Design sistema colori", description: "Definire la palette colori e le variabili CSS", status: "DONE", priority: "HIGH" },
    { id: "seed-task-03", title: "Implementare header responsive", description: "Header con menu hamburger su mobile", status: "IN_PROGRESS", priority: "MEDIUM" },
    { id: "seed-task-04", title: "Pagina chi siamo", description: "Layout e contenuti della pagina about", status: "IN_PROGRESS", priority: "MEDIUM" },
    { id: "seed-task-05", title: "Form contatti", description: "Form con validazione e invio email", status: "TODO", priority: "MEDIUM" },
    { id: "seed-task-06", title: "Ottimizzazione SEO", description: "Meta tags, sitemap, schema.org", status: "TODO", priority: "LOW" },
    { id: "seed-task-07", title: "Test cross-browser", description: "Verificare compatibilità su Chrome, Firefox, Safari", status: "TODO", priority: "HIGH" },
    { id: "seed-task-08", title: "Fix bug menu mobile", description: "Il menu non si chiude dopo il click su un link", status: "IN_PROGRESS", priority: "URGENT" },
  ];

  // --- Sample Tasks for Project 2 ---
  const tasksProject2 = [
    { id: "seed-task-09", title: "Setup progetto React Native", description: "Configurare il progetto con Expo e TypeScript", status: "DONE", priority: "HIGH" },
    { id: "seed-task-10", title: "Autenticazione utenti", description: "Login, registrazione, recupero password", status: "DONE", priority: "URGENT" },
    { id: "seed-task-11", title: "Catalogo prodotti", description: "Lista prodotti con filtri e ricerca", status: "IN_PROGRESS", priority: "HIGH" },
    { id: "seed-task-12", title: "Carrello della spesa", description: "Gestione carrello con persistenza locale", status: "TODO", priority: "HIGH" },
    { id: "seed-task-13", title: "Integrazione pagamenti Stripe", description: "Checkout con Stripe Payment Intents", status: "TODO", priority: "URGENT" },
    { id: "seed-task-14", title: "Notifiche push", description: "Setup notifiche push con Firebase", status: "TODO", priority: "MEDIUM" },
    { id: "seed-task-15", title: "Profilo utente", description: "Pagina profilo con modifica dati e storico ordini", status: "TODO", priority: "LOW" },
    { id: "seed-task-16", title: "Performance optimization", description: "Lazy loading immagini e caching API", status: "TODO", priority: "MEDIUM" },
  ];

  for (const task of tasksProject1) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        projectId: project1.id,
      },
    });
  }

  for (const task of tasksProject2) {
    await prisma.task.upsert({
      where: { id: task.id },
      update: {},
      create: {
        id: task.id,
        title: task.title,
        description: task.description,
        status: task.status,
        priority: task.priority,
        projectId: project2.id,
      },
    });
  }

  console.log("Seed: 16 task create (8 per progetto)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

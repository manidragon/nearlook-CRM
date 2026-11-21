import { Router } from 'express';
import { getLeads, getLeadById, createLead, updateLead, deleteLead } from '../controllers/leadController';
import { getBillingOverview, recordSplitPayment, toggleLateFee } from '../controllers/billingController';
import { getProjects, createProject, updateProject, deleteProject } from '../controllers/projectController';
import { getQuotations, createQuotation, deleteQuotation } from '../controllers/quotationController';
import { getClients, createClient, updateClient, deleteClient } from '../controllers/clientController';
import { getTasks, createTask, updateTask, deleteTask } from '../controllers/taskController';
import { getStaff, createStaff } from '../controllers/staffController';
import { getAppointments, createAppointment } from '../controllers/appointmentController';

const router = Router();

// Leads
router.get('/leads', getLeads);
router.get('/leads/:id', getLeadById);
router.post('/leads', createLead);
router.put('/leads/:id', updateLead);
router.patch('/leads/:id', updateLead);
router.delete('/leads/:id', deleteLead);

// Billing & Split Payments & Invoices
router.get('/payments', getBillingOverview);
router.post('/payments', recordSplitPayment);
router.post('/payments/late-fee', toggleLateFee);
router.get('/invoices', getBillingOverview);

// Projects
router.get('/projects', getProjects);
router.post('/projects', createProject);
router.put('/projects/:id', updateProject);
router.patch('/projects/:id', updateProject);
router.delete('/projects/:id', deleteProject);

// Quotations
router.get('/quotations', getQuotations);
router.post('/quotations', createQuotation);
router.delete('/quotations/:id', deleteQuotation);

// Clients
router.get('/clients', getClients);
router.post('/clients', createClient);
router.put('/clients/:id', updateClient);
router.delete('/clients/:id', deleteClient);

// Tasks
router.get('/tasks', getTasks);
router.post('/tasks', createTask);
router.put('/tasks/:id', updateTask);
router.delete('/tasks/:id', deleteTask);

// Staff
router.get('/staff', getStaff);
router.post('/staff', createStaff);

// Appointments / Calendar
router.get('/appointments', getAppointments);
router.post('/appointments', createAppointment);

export default router;

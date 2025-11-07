import { Ticket } from "../models/models.mjs"

const SERVER_URL = "http://localhost:3000";

/* Tickets */
// POST /api/tickets
const newTicket = async(serviceId) => {
  const response = await fetch(SERVER_URL + '/api/v1/tickets', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ serviceId }),
    //credentials: 'include'    da aggiungere quando implementeremo il login
  });
  if(response.ok) {
    const ticket_json = await response.json();
    const ticket = new Ticket(ticket_json.id, ticket_json.listCode);
    return ticket;
  }
  else {
    const errDetails = await response.text();
    throw errDetails;
  }
}


// GET /api/v1/services
const fetchAllServices = async () => {
  const response = await fetch(SERVER_URL + '/api/v1/services');
  if(response.ok) {
    return await response.json();
  } else {
    const errDetails = await response.text();
    throw errDetails;
  }
}

// POST /api/v1/tickets/next
const callNextTicket = async(serviceIds) => {
  const response = await fetch(SERVER_URL + '/api/v1/tickets/next', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ serviceIds }),
  });
  if(response.status === 204) {
    return null; // Nessun ticket da servire
  }
  if(response.ok) {
    return await response.json();
  } else {
    const errDetails = await response.text();
    throw errDetails;
  }
}

/* Reports */
// POST /api/v1/reports
const createReport = async (formData) => {
  const response = await fetch(SERVER_URL + '/api/v1/reports', {
    method: 'POST',
    body: formData,
    //credentials: 'include' // se serve autenticazione
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errDetails = await response.text();
    throw errDetails;
  }
};

// GET /api/v1/categories
const fetchCategories = async () => {
  const response = await fetch(SERVER_URL + '/api/v1/categories');
  if(response.ok) {
    return await response.json();
  } else {
    const errDetails = await response.text();
    throw errDetails;
  }
};

const API = { newTicket, fetchAllServices, callNextTicket, createReport, fetchCategories };
export default API;
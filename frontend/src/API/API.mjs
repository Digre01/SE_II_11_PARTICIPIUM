import { Ticket } from "../models/models.mjs"

const SERVER_URL = "http://localhost:3001";

const signUp = async (userData) => {
    const response = await fetch(SERVER_URL + "/api/users", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({userData})
    });
    return await response.json();
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

const API = { newTicket, fetchAllServices, callNextTicket };
export default API;
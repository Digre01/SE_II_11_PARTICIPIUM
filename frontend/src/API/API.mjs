import { Ticket } from "../models/models.mjs"

const SERVER_URL = "http://localhost:3000";

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

const API = { newTicket, fetchAllServices, callNextTicket, createReport };
export default API;
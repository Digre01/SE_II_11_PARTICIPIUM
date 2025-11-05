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

const API = { newTicket, fetchAllServices, callNextTicket };
export default API;
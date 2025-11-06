const SERVER_URL = "http://localhost:3000";

// Sign up a new user
//{ username, email, name, surname, password, userType }
export async function signUp(userData) {
    const response = await fetch(`${SERVER_URL}/api/sessions/signup`, {
        method: "POST",
        headers: { 
            "Content-Type": "application/json"
             },
        credentials: "include",
        body: JSON.stringify(userData),
    });
    if(response.ok) {
        return await response.json();
    } else {
        const errDetails = await response.json(); //works but need to be changed lol
        throw errDetails;
    }
}

const API = { signUp };
export default API;
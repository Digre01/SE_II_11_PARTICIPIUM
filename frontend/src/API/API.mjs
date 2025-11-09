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
        const errDetails = await response; //works but need to be changed lol
        throw errDetails;
    }
}

/* Reports */
// POST /api/v1/reports
const createReport = async (formData) => {
  const response = await fetch(SERVER_URL + '/api/v1/reports', {
    method: 'POST',
    body: formData,
    credentials: 'include'
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
  const response = await fetch(SERVER_URL + '/api/v1/categories', { credentials: 'include' });
  if(response.ok) {
    return await response.json();
  } else {
    const errDetails = await response.text();
    throw errDetails;
  }
};

const logIn = async (credentials) => {
    const response = await fetch(SERVER_URL + '/api/sessions/login', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(credentials),
    });

    if(response.ok) {
        return await response.json();
    } else {
        throw await response.text();
    }
}

const logOut = async() => {
    const response = await fetch(SERVER_URL + '/api/sessions/current', {
        method: 'DELETE',
        credentials: 'include'
    });
    if (response.ok)
        return null;
}

// PATCH /api/sessions/:id/role
export async function assignRole(userId, roleId) {
  const response = await fetch(`${SERVER_URL}/api/sessions/${userId}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ roleId })
  });

  if (response.ok) {
    return await response.json();
  } else {
    throw await response.text();
  }
}

const API = { signUp, logIn, logOut, createReport, fetchCategories, assignRole };
export default API;
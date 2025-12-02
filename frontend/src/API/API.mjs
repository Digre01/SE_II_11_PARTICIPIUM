export const SERVER_URL = "http://localhost:3000";

// Sign up a new user
//{ username, email, name, surname, password, userType }
export async function signUp(userData) {
    const response = await fetch(`${SERVER_URL}/api/v1/sessions/signup`, {
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

const logIn = async (credentials) => {
    const response = await fetch(SERVER_URL + '/api/v1/sessions/login', {
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
    const response = await fetch(SERVER_URL + '/api/v1/sessions/current', {
        method: 'DELETE',
        credentials: 'include'
    });
    if (response.ok)
        return null;
}
// PATCH /api/v1/sessions/:id/config
// Update account (multipart/form-data)
// Expects FormData with optional fields: telegramId (string), emailNotifications (boolean-like), photo (File)
const updateAccount = async (userId, formData) => {
  const response = await fetch(SERVER_URL + `/api/v1/sessions/${userId}/config`, {
    method: 'PATCH',
    body: formData,
    credentials: 'include'
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errDetails = await response.text();
    throw errDetails;
  }
}

//GET /api/v1/sessions/:id/pfp
const fetchProfilePicture = async (userId) => {
  const response = await fetch(SERVER_URL + `/api/v1/sessions/${userId}/pfp`, {
    method: 'GET',
    credentials: 'include'
  });
  if (response.ok) {
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
    credentials: 'include'
  });
  if (response.ok) {
    return await response.json();
  } else {
    const errDetails = await response.text();
    throw errDetails;
  }
};

// GET /api/v1/reports (staff)
const fetchReports = async () => {
  const response = await fetch(SERVER_URL + '/api/v1/reports', { credentials: 'include' });
  if (response.ok) return await response.json();
  throw await response.text();
};

// GET /api/v1/reports/assigned (public map)
const fetchAssignedReports = async () => {
  const [assignedReps, suspendedReps] = await Promise.all([
    fetch(SERVER_URL + `/api/v1/reports/assigned`, {credentials: 'include'}),
      fetch(SERVER_URL +  `/api/v1/reports/suspended`, { credentials: 'include' })
  ]);
  if (!assignedReps.ok) throw await assignedReps.text;
  if (!suspendedReps.ok) throw await suspendedReps.text;
  const [assigned, suspended] = await Promise.all([assignedReps.json(), suspendedReps.json()]);
  return [...assigned, ...suspended];
};

// GET /api/v1/reports/:id
const fetchReport = async (id) => {
  const response = await fetch(SERVER_URL + `/api/v1/reports/${id}`, { credentials: 'include' });
  if (response.ok) return await response.json();
  throw await response.text();
};

// PATCH /api/v1/reports/:id/review
const reviewReport = async (id, payload) => {
  const response = await fetch(SERVER_URL + `/api/v1/reports/${id}/review`, {
    method: 'PATCH',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  if (response.ok) return await response.json();
  throw await response.text();
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

// GET /api/v1/conversations
const fetchConversations = async () => {
  const response = await fetch(SERVER_URL + '/api/v1/conversations', { credentials: 'include' });
  if (response.ok) {
    return await response.json();
  } else {
    throw await response.text();
  }
};

// GET /api/v1/conversations/:conversationId/messages
const fetchMessages = async (conversationId) => {
  const response = await fetch(SERVER_URL + `/api/v1/conversations/${conversationId}/messages`, { credentials: 'include' });
  if (response.ok) {
    return await response.json();
  } else {
    throw await response.text();
  }
};

// PATCH /api/sessions/:id/role
export async function assignRole(userId, roleId) {
  const response = await fetch(`${SERVER_URL}/api/v1/sessions/${userId}/role`, {
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

// GET available staff for role assignment
export async function fetchAvailableStaff() {
  const response = await fetch(`${SERVER_URL}/api/v1/sessions/available_staff`, {
    method: 'GET',
    credentials: 'include'
  });
  if (response.ok) return await response.json();
  throw await response.text();
}

// GET all roles
export async function fetchRoles() {
  const response = await fetch(`${SERVER_URL}/api/v1/roles`, {
    method: 'GET',
    credentials: 'include'
  });
  if (response.ok) return await response.json();
  throw await response.text();
}

// GET all offices
export async function fetchOffices() {
  const response = await fetch(`${SERVER_URL}/api/v1/offices`, {
    method: 'GET',
    credentials: 'include'
  });
  if (response.ok) return await response.json();
  throw await response.text();
}

// PATCH /api/v1/reports/:id/suspend
const suspendReport = async (id) => {
  const response = await fetch(SERVER_URL + `/api/v1/reports/${id}/suspend`, {
    method: 'PATCH',
    credentials: 'include'
  });
  if (response.ok) return await response.json();
  throw await response.text();
};

// PATCH /api/v1/reports/:id/resume
const resumeReport = async (id) => {
  const response = await fetch(SERVER_URL + `/api/v1/reports/${id}/resume`, {
    method: 'PATCH',
    credentials: 'include'
  });
  if (response.ok) return await response.json();
  throw await response.text();
};
// PATCH /api/v1/reports/:id/start
const startReport = async (id) => {
  const response = await fetch(SERVER_URL + `/api/v1/reports/${id}/start`, {
    method: 'PATCH',
    credentials: 'include'
  });
  if (response.ok) return await response.json();
  throw await response.text();
};

// PATCH /api/v1/reports/:id/finish
const finishReport = async (id) => {
  const response = await fetch(SERVER_URL + `/api/v1/reports/${id}/finish`, {
    method: 'PATCH',
    credentials: 'include'
  });
  if (response.ok) return await response.json();
  throw await response.text();
};
// POST /api/v1/notifications/:conversationId/read
const markNotificationsAsRead = async (conversationId) => {
  const response = await fetch(SERVER_URL + `/api/v1/notifications/${conversationId}/read`, {
    method: 'POST',
    credentials: 'include'
  });
  if (response.ok) {
    return await response.json();
  } else {
    throw await response.text();
  }
};
// GET /api/v1/notifications
const fetchNotifications = async () => {
  const response = await fetch(SERVER_URL + '/api/v1/notifications', { credentials: 'include' });
  if (response.ok) {
    return await response.json();
  } else {
    throw await response.text();
  }
};

// GET /api/v1/notifications/counts
const fetchNotificationCounts = async () => {
  const response = await fetch(SERVER_URL + '/api/v1/notifications/counts', { credentials: 'include' });
  if (response.ok) {
    return await response.json();
  } else {
    throw await response.text();
  }
};

// POST /api/v1/conversations/:conversationId/messages
const sendMessage = async (conversationId, content) => {
  const response = await fetch(`${SERVER_URL}/api/v1/conversations/${conversationId}/messages`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content })
  });
  if (response.ok) return await response.json();
  throw await response.text();
};

const API = { signUp, logIn, logOut, createReport, fetchCategories, fetchAssignedReports, fetchConversations, fetchMessages, fetchReports, fetchReport, reviewReport, assignRole, fetchAvailableStaff, fetchRoles, fetchOffices, updateAccount, fetchProfilePicture, fetchNotifications, fetchNotificationCounts, markNotificationsAsRead, startReport, finishReport, suspendReport, resumeReport, sendMessage };
export default API;
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
// telegramId (string), emailNotifications (boolean-like), photo (File)
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

// POST /api/v1/sessions/current/telegram/request_code
export async function requestTelegramCode() {
  const response = await fetch(SERVER_URL + `/api/v1/sessions/current/telegram/request_code`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
  });
  if (response.ok) {
    return await response.json();
  } else {
    try {
      const errJson = await response.json();
      throw errJson?.message || JSON.stringify(errJson);
    } catch {
      throw await response.text();
    }
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
    throw await response.text();
  }
};

// GET /api/v1/reports (staff)
const fetchReports = async (categoryId, isExternal) => {
  const url = new URL(SERVER_URL + '/api/v1/reports');

  if (categoryId !== undefined && categoryId !== null) {
    url.searchParams.append('categoryId', categoryId);
  }

  if (isExternal !== undefined && isExternal !== null) {
    url.searchParams.append('isExternal', String(isExternal));
  }

  const response = await fetch(url, {
    method: "GET",
    credentials: 'include'
  });

  if (response.ok) return await response.json();
  throw await response.text();
};

const fetchReportPhotos = async (reportId) => {
  const response = await fetch(`${SERVER_URL}/api/v1/reports/${reportId}/photos`, {
    method: 'GET',
  });
  if (response.ok) return await response.json();
  throw await response.text();
}

// GET /api/v1/reports/assigned + /api/v1/reports/suspended (public map)
const fetchAssignedReports = async () => {
  const [assignedRes, suspendedRes, inProgressRes] = await Promise.all([
    fetch(SERVER_URL + '/api/v1/reports/assigned', { credentials: 'include' }),
    fetch(SERVER_URL + '/api/v1/reports/suspended', { credentials: 'include' }),
    fetch(SERVER_URL + '/api/v1/reports/in_progress', { credentials: 'include' })
  ]);
  if (!assignedRes.ok) throw await assignedRes.text();
  if (!suspendedRes.ok) throw await suspendedRes.text();
  if (!inProgressRes.ok) throw await inProgressRes.text();
  const [assigned, suspended, inProgress] = await Promise.all([
    assignedRes.json(),
    suspendedRes.json(),
    inProgressRes.json()
  ]);
  return [...assigned, ...suspended, ...inProgress];
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

// PATCH /api/v1/sessions/:id/role
export async function assignRole(userId, roleId, isExternal) {
  const response = await fetch(`${SERVER_URL}/api/v1/sessions/${userId}/role`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ roleId, isExternal })
  });

  if (response.ok) {
    return await response.json();
  } else {
    throw await response.text();
  }
}

// GET /api/v1/sessions/:id/roles
export async function fetchUserRoles(userId) {
  const response = await fetch(`${SERVER_URL}/api/v1/sessions/${userId}/roles`, {
    method: 'GET',
    credentials: 'include'
  });
  if (response.ok) {
    return await response.json();
  } else {
    throw await response.text();
  }
}

// GET /api/v1/sessions/me/roles
export async function fetchMyRoles() {
  const response = await fetch(`${SERVER_URL}/api/v1/sessions/me/roles`, {
    method: 'GET',
    credentials: 'include'
  });
  if (response.ok) {
    return await response.json();
  } else {
    throw await response.text();
  }
}

// PUT /api/v1/sessions/:id/roles
export async function setUserRoles(userId, rolesPayload) {
  const response = await fetch(`${SERVER_URL}/api/v1/sessions/${userId}/roles`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    credentials: 'include',
    body: JSON.stringify({ roles: rolesPayload })
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

// GET assigned staff (already have at least one role)
export async function fetchAssignedStaff() {
  const response = await fetch(`${SERVER_URL}/api/v1/sessions/assigned_staff`, {
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

// GET offices
export async function fetchOffice(id) {
    const response = await fetch(`${SERVER_URL}/api/v1/offices/${id}`, {
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

// PATCH /api/v1/reports/:id/assign_external
const assignReportToExternalMaintainer = async (id) => {
    const response = await fetch(SERVER_URL + `/api/v1/reports/${id}/assign_external`, {
        method: 'PATCH',
        credentials: 'include'
    });
    if (response.ok) return await response.json();
    throw await response.text();
}

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

// POST /api/v1/sessions/current/verify_email
const verifyEmail = async (code) => {
  const response = await fetch(SERVER_URL + `/api/v1/sessions/current/verify_email`, {
    method: 'POST',
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code })
  });
  if (response.ok) return await response.json();
  throw await response.text();
};

// GET /api/v1/sessions/current/email_verified
const checkEmailVerified = async () => {
  const response = await fetch(SERVER_URL + `/api/v1/sessions/current/email_verified`, {
    method: 'GET',
    credentials: 'include'
  });
  if (response.ok) return await response.json();
  throw await response.text();
};

// POST /api/v1/sessions/current/resend_verification
const resendVerification = async () => {
  const response = await fetch(SERVER_URL + `/api/v1/sessions/current/resend_verification`, {
    method: 'POST',
    credentials: 'include'
  });
  if (response.ok) return await response.json();
  throw await response.text();
};

const fetchOfficeCategory = async (officeId, isExternal) => {
  const url = new URL(`${SERVER_URL}/api/v1/offices/${officeId}/categories`);
  url.searchParams.append("isExternal", isExternal); // flag come query string

  const response = await fetch(url.toString(), {
    method: 'GET',
    credentials: 'include',
  });

  if (response.ok) return await response.json();
  throw await response.text();
}

const fetchReportsByTechnician = async (userId) => {
    const response = await fetch(`${SERVER_URL}/api/v1/reports/technician/${userId}`, {
        method: 'GET',
        credentials: 'include'
    });
  if (response.ok) return await response.json();
  throw await response.text();
}

const API = {
  signUp, logIn, logOut, createReport, fetchCategories, fetchAssignedReports, fetchConversations, fetchMessages,
  fetchReports, fetchReportPhotos, fetchReport, reviewReport, assignRole, fetchAvailableStaff, fetchAssignedStaff,
  fetchRoles, fetchOffices, fetchOffice, updateAccount, fetchProfilePicture, fetchNotifications, fetchNotificationCounts,
  markNotificationsAsRead, startReport, finishReport, suspendReport, resumeReport, assignReportToExternalMaintainer,
  sendMessage, fetchMyRoles, fetchUserRoles, setUserRoles, verifyEmail, checkEmailVerified, resendVerification,
  requestTelegramCode, fetchReportsByTechnician, fetchOfficeCategory };
export default API;
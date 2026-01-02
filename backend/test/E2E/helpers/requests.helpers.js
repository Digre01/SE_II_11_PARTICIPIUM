const URL = "http://localhost:3000"

export const getAssignedReports = async (page, request) => {
    const response = await request.get(`${URL}/api/v1/reports/assigned`)
    return await response.json()
};

export async function getTestReport(page, request) {
    const URL = "http://localhost:3000"

    await request.post(`${URL}/api/v1/sessions/login`, {
        data: { username: 'staff1', password: 'staff1' },
        headers: {
            'Content-Type': 'application/json'
        },
    });
    const response = await request.get(`${URL}/api/v1/reports`)
    const reports = await response.json();
    return reports.filter(r => r.title === "Test Report")[0]
}

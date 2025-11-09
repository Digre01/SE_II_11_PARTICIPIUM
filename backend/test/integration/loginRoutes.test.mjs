import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import request from "supertest";

// Stub del repository TypeORM usato da userRepository
const repoStub = {
    findOneBy: jest.fn(),
    save: jest.fn(),
};

// Mock del DataSource PRIMA di importare l'app
await jest.unstable_mockModule("../../config/data-source.js", () => ({
    AppDataSourcePostgres: {
        getRepository: jest.fn(() => repoStub),
    },
}));

// Import app (Express) dopo il mock
const { default: app } = await import("../../app.js");

// Per preparare un utente con password hashata per il login
const { default: userService } = await import("../../services/userService.js");

function extractSessionCookie(res) {
    const setCookie = res.headers["set-cookie"]; 
    if (!setCookie) return null;
    // usa solo "name=value" e concatena se necessario
    return setCookie.map((c) => c.split(";")[0]).join("; ");
}

describe("Auth routes (integration, mocked DB)", () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it("POST /api/sessions/signup -> 201 + cookie (username/email liberi)", async () => {
        const dto = {
            username: "mario",
            email: "mario@example.com",
            name: "Mario",
            surname: "Rossi",
            password: "SuperSecret123",
            salt: "",
            userType: "customer",
        };

        // Nessun conflitto: username OK, email OK
        repoStub.findOneBy
            .mockResolvedValueOnce(null) // check username
            .mockResolvedValueOnce(null); // check email
        // Salvataggio di un nuovo utente (id assegnato)
        repoStub.save.mockResolvedValue({ id: 1, ...dto });

        const res = await request(app).post("/api/sessions/signup").send(dto);
        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ id: 1, username: dto.username, email: dto.email });
        expect(extractSessionCookie(res)).toBeTruthy();
    });

    it("POST /api/sessions/signup -> 409 con username esistente", async () => {
        const dto = {
            username: "existinguser",
            email: "existinguser@example.com",
            name: "Existing",
            surname: "User",
            password: "SuperSecret123",
            salt: "",
            userType: "customer",
        };

        // Simula la presenza dell'utente nel DB
        repoStub.findOneBy.mockResolvedValueOnce(dto);

        const res = await request(app).post("/api/sessions/signup").send(dto);
        expect(res.status).toBe(409);
    });

    it("POST /api/sessions/login -> 201 + cookie (credenziali corrette)", async () => {
        const username = "lucia";
        const plain = "Pa$$w0rd!";
        const salt = "testsalt"; // valore di comodo per il test
        const hashed = await userService.hashPassword(plain, salt);

        // La strategia Local leggerà l'utente tramite username
        repoStub.findOneBy.mockResolvedValueOnce({
            id: 10,
            username,
            email: "lucia@example.com",
            name: "Lucia",
            surname: "Verdi",
            password: hashed,
            salt,
            userType: "customer",
        });

        const res = await request(app)
            .post("/api/sessions/login")
            .send({ username, password: plain });

        expect(res.status).toBe(201);
        expect(res.body).toMatchObject({ username });
        expect(extractSessionCookie(res)).toBeTruthy();
    });

    it("POST /api/sessions/login -> 401 con username inesistente", async () => {
        const res = await request(app)
            .post("/api/sessions/login")
            .send({ username: "nonexist", password: "irrelevant" });
        expect(res.status).toBe(401);
    });

    it("POST /api/sessions/login -> 401 con password errata", async () => {
        const username = "francesco";
        const correctPlain = "CorrectPassword!";
        const salt = "testsalt2";
        const hashed = await userService.hashPassword(correctPlain, salt);
        // Utente esistente
        repoStub.findOneBy.mockResolvedValueOnce({
            id: 11,
            username,
            email: "francesco@example.com",
            name: "Francesco",
            surname: "Verdi",
            password: hashed,
            salt,
            userType: "customer",
        });
        const res = await request(app)
            .post("/api/sessions/login")
            .send({ username, password: "WrongPassword!" });
        expect(res.status).toBe(401);
    });

    it("GET /api/sessions/current -> 401 senza cookie", async () => {
        const res = await request(app).get("/api/sessions/current");
        expect(res.status).toBe(401);
        expect(res.body).toMatchObject({ error: "Not authenticated" });
    });

    it("GET /api/sessions/current -> 200 con session valida", async () => {
        const dto = {
            username: "anna",
            email: "anna@example.com",
            name: "Anna",
            surname: "Bianchi",
            password: "SuperSecret123",
            salt: "",
            userType: "customer",
        };

        // signup: no conflitti + save
        repoStub.findOneBy
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);
        repoStub.save.mockResolvedValue({ id: 22, ...dto });
        const signup = await request(app).post("/api/sessions/signup").send(dto);
        const cookie = extractSessionCookie(signup);
        expect(cookie).toBeTruthy();

        // La middleware di sessione deserializza l'utente via id
        repoStub.findOneBy.mockResolvedValueOnce({ id: 22, ...dto });
        const res = await request(app).get("/api/sessions/current").set("Cookie", cookie);
        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ id: 22, username: dto.username, email: dto.email });
    });

    it("GET /api/sessions/current -> 200 con session valida e due GET consecutivi", async () => {
        const dto = {
            username: "anna",
            email: "anna@example.com",
            name: "Anna",
            surname: "Bianchi",
            password: "SuperSecret123",
            salt: "",
            userType: "customer",
        };

        // signup: no conflitti + save
        repoStub.findOneBy
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);
        repoStub.save.mockResolvedValue({ id: 22, ...dto });
        const signup = await request(app).post("/api/sessions/signup").send(dto);
        const cookie = extractSessionCookie(signup);
        expect(cookie).toBeTruthy();

        // La middleware di sessione deserializza l'utente via id
        repoStub.findOneBy.mockResolvedValueOnce({ id: 22, ...dto });
        const res1 = await request(app).get("/api/sessions/current").set("Cookie", cookie);
        expect(res1.status).toBe(200);
        expect(res1.body).toMatchObject({ id: 22, username: dto.username, email: dto.email });
        // Ogni richiesta fa una nuova deserializeUser -> serve un'altra risposta mock
        repoStub.findOneBy.mockResolvedValueOnce({ id: 22, ...dto });
        const res2 = await request(app).get("/api/sessions/current").set("Cookie", cookie);
        expect(res2.status).toBe(200);
        expect(res2.body).toMatchObject({ id: 22, username: dto.username, email: dto.email });
    });

    it("DELETE /api/sessions/current -> logout; poi current è 401", async () => {
        const dto = {
            username: "giulia",
            email: "giulia@example.com",
            name: "Giulia",
            surname: "Neri",
            password: "SuperSecret123",
            salt: "",
            userType: "customer",
        };

        // signup: no conflitti + save
        repoStub.findOneBy
            .mockResolvedValueOnce(null)
            .mockResolvedValueOnce(null);
        repoStub.save.mockResolvedValue({ id: 33, ...dto });
        const signup = await request(app).post("/api/sessions/signup").send(dto);
        const cookie = extractSessionCookie(signup);
        expect(cookie).toBeTruthy();

        // logout
        const del = await request(app).delete("/api/sessions/current").set("Cookie", cookie);
        expect([200, 204]).toContain(del.status);

        // old cookie non più valido
        const after = await request(app).get("/api/sessions/current").set("Cookie", cookie);
        expect(after.status).toBe(401);

        
    });
});

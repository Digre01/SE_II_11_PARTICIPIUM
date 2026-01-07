## Bare metal

### Server start

To start the server run:

```bash
npm install
node index.mjs
```

### Database start

To start the database for the first time run:

```bash
docker build -t se_ii_postgres .\database
docker run -d --name se_ii_db -p 5432:5432 -v se_ii_db_data:/var/lib/postgresql/data -e POSTGRES_PASSWORD=postgres se_ii_postgres
```

The next time, only run the container.

### Frontend start

To start React:

```bash
npm install
npm run dev
```

## Docker

### Prod mode

- `
docker compose up
`

### Test mode

- `docker compose down -v`
- `docker compose -f docker-compose.dev.yml -f docker-compose.test.yml --profile test up --build`

## Adminer

    
   |  |  |
   | :--- | :--- | 
   | **DB type** | postgres |
   | **username** | postgres |
   | **password** | postgres |
   |**db** | se_ii_db |

# User Credentials

## General Accounts

| Account Type | Username | Password |
| :--- | :--- | :--- |
| **Citizen** | `citizen` | `citizen` |
| **Admin** | `admin` | `admin` |

---

## Internal Staff Members

| Username | Password | Role | Office |
| :--- | :--- | :--- | :--- |
| `staff1` | `staff1` | Municipal Public Relations Officer | Organization Office |
| `staff2` | `staff2` | Lighting Technician | Public Lighting Office |
| `staff3` | `staff3` | Public Works Supervisor | Roads and Urban Furnishings Office |
### External maintainer

| Username | Password | Role | Office |
| :--- | :--- | :--- | :--- |
| `external1` | `external1` | Lighting Technician | IREN |

## Roles and Offices

| Role                               | Municipal Office                          | External Office |
| ---------------------------------- | ----------------------------------------- | --------------- |
| Municipal Public Relations Officer | Organization Office                       |                 |
| Municipal Administrator            | Organization Office                       |                 |
| Water Systems Technician           | Water Office                              | SMAT            |
| Accessibility Coordinator          | Architectural Barriers Office             | AccessiWay      |
| Wastewater Engineer                | Sewer System Office                       | Bosco Spurghi   |
| Lighting Technician                | Public Lighting Office                    | IREN            |
| Waste Management Officer           | Waste Management Office                   | Soris           |
| Traffic Systems Technician         | Road Signs and Traffic Lights Office      | 5T Srl          |
| Public Works Supervisor            | Roads and Urban Furnishings Office        | F.G. Srl        |
| Parks and Recreation Officer       | Public Green Areas and Playgrounds Office | Turin Garden    |
| General Maintenance Worker         | Generic Office                            | taskrabbit      |

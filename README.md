## Bare metal

### Server start

To start the server run:

```bash
npm install
node index.mjs
```

### Database start

To start the database for the first time run:

``` bash
docker build -t se_ii_postgres .\database
docker run -d --name se_ii_db -p 5432:5432 -v se_ii_db_data:/var/lib/postgresql/data -e POSTGRES_PASSWORD=postgres se_ii_postgres
```

The next time, only run the container.


### Frontend start

To start React:

``` bash
npm install
npm run dev
``` 

## Docker

Just run: 

``` bash
docker compose up
```

To start in test mode, run:
-   `docker compose down -v`
- `docker compose -f docker-compose.dev.yml -f docker-compose.test.yml --profile test up --build`

## Adminer
    Db type: postgres
    username: postgres
    password: postgres
    db: se_ii_db

## User credentials
### Citizen:

    username: citizen
    password: citizen

### Admin:

    username: admin
    password: admin

### Internal staff members:

    username: staff1
    password: staff1
    role: Municipal Public Relations Officer
    office: Organization Office

    username: staff2
    password: staff2
    role: Lighting Technician
    office: Public Lighting Office

    username: staff3
    password: staff3
    role: Public Works Supervisor
    office: Roads and Urban Furnishings Office

### External maintainer

    username: external1
    password: external1
    role: Lighting Technician
    office: IREN

## Roles and Offices

| Role                               | Municipal Office                          | External Office |
|------------------------------------|-------------------------------------------|-----------------|
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


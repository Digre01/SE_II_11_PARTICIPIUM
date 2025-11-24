# Team 11 - Participium

To start the application:

### 1. Prepare the configuration file

Create a new folder on your computer, enter it, and create a file named `docker-compose.yml`. Paste the following content:

```
services:
  db:
    image: postgres:16-alpine
    container_name: se_ii_postgres
    environment:
      POSTGRES_USER: ${POSTGRES_USER:-postgres}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      POSTGRES_DB: ${POSTGRES_DB:-se_ii_db}
    ports:
      - "5432:5432"
    volumes:
      - db_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-postgres} -d ${POSTGRES_DB:-se_ii_db}"]
      interval: 10s
      timeout: 5s
      retries: 5
    restart: unless-stopped

  # Frontend Application
  frontend:
    image: matteodigregorio/team-11-participium:frontend
    container_name: frontend
    ports:
      - "5173:5173"
    depends_on:
      db:
        condition: service_healthy

  # Backend Application
  backend:
    image: matteodigregorio/team-11-participium:backend
    container_name: backend
    ports:
      - "3000:3000"
    environment:
      PG_HOST: db
      PG_PORT: 5432
      PG_USER: ${POSTGRES_USER:-postgres}
      PG_PASSWORD: ${POSTGRES_PASSWORD:-postgres}
      PG_DB: ${POSTGRES_DB:-se_ii_db}
    depends_on:
      db:
        condition: service_healthy

volumes:
  db_data:
```

### 2. Start the application

From the folder where you created the file, open a terminal and run:

```
docker compose up -d
```

Docker will download the necessary images and start the containers

### 3. Access the services

Once everything is started:

* **Frontend:** [http://localhost:5173](http://localhost:5173 "null")
* **Backend API:** [http://localhost:3000](http://localhost:3000 "null")
* **Database:** Accessible at `localhost:5432` (User: `postgres`, Pass: `postgres`). *Check advanced configuration for adminer config*

### 4. Users credentials

#### Citizen:

    username: citizen
    password: citizen

#### Admin:

    username: admin
    password: admin

#### Staff:

    username: staff1
    password: staff1

    username: staff2
    password: staff2

    username: staff3
    password: staff3


### Advanced Configuration (Optional)

#### 1. Personal credential configuration

If you want to modify default passwords or ports, you can create a `.env` file in the same folder as `docker-compose.yml`:

```
POSTGRES_USER=my_user
POSTGRES_PASSWORD=my_password
POSTGRES_DB=my_db
```

If you do not create this file, default values will be used (`postgres`/`postgres`).

#### 2. Adminer installation and usage

[Adminer](https://hub.docker.com/_/adminer/) is a full-featured database management tool written in PHP
You can add it in the `docker-compose.yml`

```
    adminer:

        image: adminer
        restart: always
        ports:
        - 8080:8080
        environment:
        - ADMINER_DESIGN=galkaev
```

**Adminer:** [http://localhost:8080](http://localhost:8080 "null")

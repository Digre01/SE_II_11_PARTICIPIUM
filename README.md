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

## Adminer
Db type: postgres
username: postgres
password: postgres
db: se_ii_db
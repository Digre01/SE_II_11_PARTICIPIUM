FROM postgres:16-alpine

# sensible defaults (override at runtime)
ENV POSTGRES_USER=POSTGRES_USER
ENV POSTGRES_PASSWORD=POSTGRES_PASSWORD
ENV POSTGRES_DB=POSTGRES_DB

# persist DB files
VOLUME ["/var/lib/postgresql/data"]

# expose the PostgreSQL port
EXPOSE 5432
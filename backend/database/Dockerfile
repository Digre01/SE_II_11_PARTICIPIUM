FROM postgres:16-alpine

# sensible defaults (override at runtime)
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres
ENV POSTGRES_DB=se_ii_db

# persist DB files
VOLUME ["/var/lib/postgresql/data"]

# expose the PostgreSQL port
EXPOSE 5432
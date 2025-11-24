CREATE TABLE "Users"(
    "id" BIGINT NOT NULL,
    "username" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "surname" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "salt" TEXT NOT NULL,
    "userType" TEXT NOT NULL
);
ALTER TABLE
    "Users" ADD PRIMARY KEY("id");
CREATE TABLE "Report"(
    "id" BIGINT NOT NULL,
    "title" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "latitude" BIGINT NOT NULL,
    "longitude" BIGINT NOT NULL,
    "status" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "reject_explanation" TEXT NULL
);
ALTER TABLE
    "Report" ADD PRIMARY KEY("id");
CREATE TABLE "Photos"(
    "id" BIGINT NOT NULL,
    "reportId" TEXT NOT NULL,
    "link" TEXT NOT NULL
);
ALTER TABLE
    "Photos" ADD PRIMARY KEY("id");
CREATE TABLE "User-Office"(
    "userId" BIGINT NOT NULL,
    "officeId" BIGINT NOT NULL,
    "roleId" BIGINT NOT NULL
);
ALTER TABLE
    "User-Office" ADD PRIMARY KEY("userId");
CREATE TABLE "Roles"(
    "id" BIGINT NOT NULL,
    "name" TEXT NOT NULL
);
ALTER TABLE
    "Roles" ADD PRIMARY KEY("id");
CREATE TABLE "Office"(
    "id" BIGINT NOT NULL,
    "name" BIGINT NOT NULL
);
ALTER TABLE
    "Office" ADD PRIMARY KEY("id");
CREATE TABLE "Categories"(
    "id" BIGINT NOT NULL,
    "name" BIGINT NOT NULL,
    "officeId" BIGINT NOT NULL
);
ALTER TABLE
    "Categories" ADD PRIMARY KEY("id");
ALTER TABLE
    "User-Office" ADD CONSTRAINT "user_office_userid_foreign" FOREIGN KEY("userId") REFERENCES "Users"("id");
ALTER TABLE
    "Report" ADD CONSTRAINT "report_categoryid_foreign" FOREIGN KEY("categoryId") REFERENCES "Categories"("id");
ALTER TABLE
    "User-Office" ADD CONSTRAINT "user_office_roleid_foreign" FOREIGN KEY("roleId") REFERENCES "Roles"("id");
ALTER TABLE
    "Office" ADD CONSTRAINT "office_name_foreign" FOREIGN KEY("name") REFERENCES "Categories"("officeId");
ALTER TABLE
    "Photos" ADD CONSTRAINT "photos_reportid_foreign" FOREIGN KEY("reportId") REFERENCES "Report"("id");
ALTER TABLE
    "User-Office" ADD CONSTRAINT "user_office_officeid_foreign" FOREIGN KEY("officeId") REFERENCES "Office"("id");
ALTER TABLE
    "Report" ADD CONSTRAINT "report_userid_foreign" FOREIGN KEY("userId") REFERENCES "Users"("id");
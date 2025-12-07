import { EntitySchema } from "typeorm";

export const Categories = new EntitySchema({
    name: 'Categories',
    tableName: 'Categories',
    columns: {
        id: {
            type: Number,
            primary: true,
            generated: 'increment'
        },
        name: {
            type: String,
            nullable: false
        },
        officeId: {
            type: Number,
            nullable: false
        },
        externalOfficeId: {
            type: Number,
            nullable: false
        }
    },
    relations: {
        reports: {
            type: 'one-to-many',
            target: 'Reports',
            inverseSide: 'category'
        },
        office: {
            type: 'many-to-one',  // Cambiato da one-to-one a many-to-one
            target: 'Offices',
            joinColumn: { name: 'officeId' },
            inverseSide: 'categories'  // Cambiato da 'category' a 'categories'
        },
        externalOffice: {
            type: 'many-to-one',
            target: 'Offices',
            joinColumn: { name: 'externalOfficeId' },
            nullable: true
        }
    }
});
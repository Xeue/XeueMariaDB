declare module 'xeue-sql';

export class SQLSession {
    constructor(
        host: string,
        port: string,
        username: string,
        password: string,
        databaseName: string,
        logger: Object,
        definitions: [{
            name: string,
            definition: string,
            PK: string
        }]
    ) {}

    async init(table: [{
        name: string,
        definition: string,
        PK: string
    }]) {}

    async tableCheck(
        table: string,
        tableDef: string,
        pk: string
    ) {}

    async query(
        query: string
    ) {}

    async insert(
        _values: {column:string, value:any},
        table: string
    ) {}

    async update(
        _values: {column:string, value:any},
        _conditions: {column:string, value:any},
        table: string
    ) {}
}
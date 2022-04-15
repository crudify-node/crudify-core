export enum type {
    ONETOONE,
    ONETOMANY
}
export interface StaticField {
    name: String,
    type: String,
    isUnique?: Boolean  
}
export interface RelationalField {
    connection: string,
    foreignKey: string,
    type: type
}
export class Model {
    name!: String;
    attributes!: { staticField: Array<StaticField>, relationalField: Array<RelationalField> }
    constructor(name:string){
        this.name=name as string;
    }

}
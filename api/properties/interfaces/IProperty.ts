export interface IComp {
    id: string;
}

export interface IProperty {
    _id: string;
    name: string;
    address: string;
    city: string;
    state: string;
    zip: string;
    loc: [number, number];
    custom?: {
        owner: {
            name: string;
            id: string;
        },
    };
    comps?: IComp[];
}

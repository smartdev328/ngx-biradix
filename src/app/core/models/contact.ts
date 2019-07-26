export interface IContact {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface ILoggedInContact extends IContact{
  properties: string;
  role: string;
  company: string;
}

export interface IBookTrainingContact extends ILoggedInContact{
  date: Date;
  requesterName: string;
  requesterEmail: string;
  someoneElse: boolean;
}

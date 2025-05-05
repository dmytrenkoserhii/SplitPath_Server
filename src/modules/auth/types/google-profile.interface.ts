export interface GoogleProfile {
  id: string;
  emails: Array<{ value: string }>;
  name: {
    givenName: string;
    familyName: string;
  };
}

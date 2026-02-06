declare module 'passport-oauth1' {
  import { Strategy as PassportStrategy } from 'passport';
  import { Request } from 'express';

  export interface IStrategyOptions {
    requestTokenURL: string;
    accessTokenURL: string;
    userAuthorizationURL: string;
    consumerKey: string;
    consumerSecret: string;
    callbackURL: string;
    customHeaders?: Record<string, string>;
    signatureMethod?: string;
  }

  export type VerifyFunction = (
    token: string,
    tokenSecret: string,
    profile: any,
    done: (err: Error | null, user?: any, info?: any) => void
  ) => void;

  export class Strategy extends PassportStrategy {
    constructor(options: IStrategyOptions, verify: VerifyFunction);
    
    name: string;
    
    _oauth: {
      get(
        url: string,
        token: string,
        tokenSecret: string,
        callback: (err: { statusCode: number; data?: string } | any, body: string | Buffer, res: any) => void
      ): void;
    };

    userProfile(
      token: string,
      tokenSecret: string,
      params: Record<string, unknown>,
      done: (err: Error | null, profile?: any) => void
    ): void;
  }
}
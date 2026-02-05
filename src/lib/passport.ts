import passport from 'passport';
import { Strategy as OAuth1Strategy } from 'passport-oauth1';
import { IncomingMessage } from 'http';

const BASE_URL = process.env.USOS_API_BASE_URL;

if (!BASE_URL) {
    throw new Error("USOS_API_BASE_URL is not set");
}

if (!process.env.USOS_CONSUMER_KEY || !process.env.USOS_CONSUMER_SECRET) {
    throw new Error("Missing USOS Consumer Key or Secret");
}

class UsosStrategy extends OAuth1Strategy {
  constructor(options: any, verify: any) {
    super(options, verify);
    this.name = 'usos';
  }

  userProfile(token: string, tokenSecret: string, params: any, done: any) {
    this._oauth.get(
      `${BASE_URL}users/user`,
      token,
      tokenSecret,
      (err: { statusCode?: number; data?: any } | Error | null, body: string | Buffer, res: IncomingMessage) => {
        if (err) {
            return done(new Error('Failed to fetch user profile'), null);
        }
        
        try {
          const json = JSON.parse(body as string);
          
          const profile = {
            provider: 'usos',
            id: json.id,
            first_name: json.first_name,
            last_name: json.last_name,
            _raw: body,
            _json: json
          };
          
          done(null, profile);
        } catch (e) {
          done(new Error('Failed to parse user profile'), null);
        }
      }
    );
  }
}

passport.use(new UsosStrategy({
    requestTokenURL: `${BASE_URL}oauth/request_token?scopes=studies`,
    accessTokenURL: `${BASE_URL}oauth/access_token`,
    userAuthorizationURL: `${BASE_URL}oauth/authorize`,
    consumerKey: process.env.USOS_CONSUMER_KEY!,
    consumerSecret: process.env.USOS_CONSUMER_SECRET!,
    callbackURL: 'oob'
  },
  (token: string, tokenSecret: string, profile: any, done: any) => {
     const user = {
         id: profile.id,
         name: profile.first_name + ' ' + profile.last_name,
         token: token,
         tokenSecret: tokenSecret
     };
     done(null, user);
  }
) as unknown as passport.Strategy);

import passport from 'passport';
import { Strategy as OAuth1Strategy, IStrategyOptions } from 'passport-oauth1';

const BASE_URL = process.env.USOS_API_BASE_URL;

if (!BASE_URL) {
  throw new Error("USOS_API_BASE_URL is not set");
}
interface UsosProfile {
  provider: 'usos';
  id: string;
  _raw: string | Buffer;
  _json: { id: string; [key: string]: unknown };
}

export interface UsosUser {
  id: string;
  token: string;
  tokenSecret: string;
}

class UsosStrategy extends OAuth1Strategy {
  constructor(options: IStrategyOptions, verify: any) {
    super(options, verify);
    this.name = 'usos';
  }

  public override userProfile(
    token: string, tokenSecret: string, params: Record<string, unknown>,
    done: (err: Error | null, profile?: UsosProfile) => void ): void {
    this._oauth.get(`${process.env.USOS_API_BASE_URL}users/user`, token, tokenSecret,
      (err, body) => {
        if (err) return done(new Error('Failed to fetch profile'));
        
        try {
          const json = JSON.parse(body as string);
          done(null, {
            provider: 'usos',
            id: json.id,
            _raw: body,
            _json: json
          });
        } catch {
          done(new Error('Parsing failed'));
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
}, (token: string, tokenSecret: string, profile: UsosProfile,
  done: (err: Error | null, user?: UsosUser) => void) => {
    const user: UsosUser = {
      id: profile.id,
      token: token,
      tokenSecret: tokenSecret
    };

    done(null, user);
  })
);
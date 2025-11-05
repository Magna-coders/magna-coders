declare module '@paypal/checkout-server-sdk';
declare module 'nodemailer';

declare module 'jsonwebtoken' {
  export interface JwtPayload {
    id: string;
    [key: string]: any;
  }

  export type Secret = string | Buffer;

  export interface SignOptions {
    expiresIn?: string | number;
    algorithm?: string;
    audience?: string | string[];
    issuer?: string;
    jwtid?: string;
    subject?: string;
    noTimestamp?: boolean;
    header?: object;
    keyid?: string;
  }

  export function sign(
    payload: string | Buffer | object,
    secretOrPrivateKey: Secret,
    options?: SignOptions
  ): string;

  export function verify(token: string, secretOrPublicKey: Secret): JwtPayload;
  
  export function decode(token: string, options?: { complete?: boolean }): null | JwtPayload;

  export class JsonWebTokenError extends Error {
    constructor(message: string);
  }

  export class TokenExpiredError extends JsonWebTokenError {
    constructor(message: string, expiredAt: Date);
    expiredAt: Date;
  }

  export class NotBeforeError extends JsonWebTokenError {
    constructor(message: string, date: Date);
    date: Date;
  }
}

// allow importing some SDKs without types in this workspace
declare module 'stripe' {
  const Stripe: any;
  export default Stripe;
}

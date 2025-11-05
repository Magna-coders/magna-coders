declare module '@paypal/checkout-server-sdk';
declare module 'nodemailer';

declare module 'bcryptjs' {
  /**
   * Generate a salt synchronously.
   * @param rounds Number of rounds to use, defaults to 10 if omitted
   * @returns The salt as a string
   */
  export function genSaltSync(rounds?: number): string;

  /**
   * Generate salt asynchronously.
   * @param rounds Number of rounds to use, defaults to 10 if omitted
   * @returns Promise resolving with the generated salt
   */
  export function genSalt(rounds?: number): Promise<string>;

  /**
   * Hash data synchronously.
   * @param data Data to hash
   * @param saltOrRounds The salt to use, or the number of rounds to generate a salt
   * @returns The hashed data
   */
  export function hashSync(data: string, saltOrRounds: string | number): string;

  /**
   * Hash data asynchronously.
   * @param data Data to hash
   * @param saltOrRounds The salt to use, or the number of rounds to generate a salt
   * @returns Promise resolving with the hashed data
   */
  export function hash(data: string, saltOrRounds: string | number): Promise<string>;

  /**
   * Compare data with hash synchronously.
   * @param data Data to compare
   * @param encrypted Data to be compared to
   * @returns True if matching, false otherwise
   */
  export function compareSync(data: string, encrypted: string): boolean;

  /**
   * Compare data with hash asynchronously.
   * @param data Data to compare
   * @param encrypted Data to be compared to
   * @returns Promise resolving with true if matching, false otherwise
   */
  export function compare(data: string, encrypted: string): Promise<boolean>;
}

declare module 'cors' {
  import { RequestHandler } from 'express';

  interface CorsOptions {
    /** Configures the Access-Control-Allow-Origin CORS header */
    origin?: boolean | string | RegExp | (string | RegExp)[] | ((requestOrigin: string | undefined, callback: (err: Error | null, origin?: boolean | string | RegExp | (string | RegExp)[]) => void) => void);
    /** Configures the Access-Control-Allow-Methods CORS header */
    methods?: string | string[];
    /** Configures the Access-Control-Allow-Headers CORS header */
    allowedHeaders?: string | string[];
    /** Configures the Access-Control-Expose-Headers CORS header */
    exposedHeaders?: string | string[];
    /** Configures the Access-Control-Allow-Credentials CORS header */
    credentials?: boolean;
    /** Configures the Access-Control-Max-Age CORS header */
    maxAge?: number;
    /** Pass the CORS preflight response to the next handler */
    preflightContinue?: boolean;
    /** Provides a status code to use for successful OPTIONS requests */
    optionsSuccessStatus?: number;
  }

  interface CorsRequest {
    method?: string;
    headers: {
      origin?: string;
      'access-control-request-method'?: string;
      'access-control-request-headers'?: string;
    };
  }

  interface CorsStatic {
    (options?: CorsOptions): RequestHandler;
    /** 
     * Create a cors middleware from passed options 
     * @param options cors options
     */
    (options: CorsOptions): RequestHandler;
  }

  const cors: CorsStatic;
  export = cors;
}

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

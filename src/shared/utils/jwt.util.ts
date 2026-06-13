// FILE COMMENTED OUT FOR TEAM REVIEW: active implementation paused except db/env setup
// import jwt from 'jsonwebtoken';
// import { config } from '@config/env';
// import { JwtPayload } from '@shared/types';
//
// export const signJwt = (payload: JwtPayload) => jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn });
//
// export const verifyJwt = (token: string) => jwt.verify(token, config.jwtSecret) as JwtPayload;
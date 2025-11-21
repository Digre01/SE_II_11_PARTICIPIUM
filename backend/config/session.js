import session from 'express-session';

export const sessionMiddleware = session({
    secret: "shhhhh... it's a secret!",
    resave: false,
    saveUninitialized: false,
});
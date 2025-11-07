export function authorizeUserType(allowedTypes) {
    return async function (req, res, next) {

        if (!req.isAuthenticated()) {
            const err = new Error('UNAUTHORIZED');
            return next(err);
        }

        if (!allowedTypes.includes(req.user.userType)) {
            const err = new Error('FORBIDDEN');
            return next(err);
        }
        next();
    };
}

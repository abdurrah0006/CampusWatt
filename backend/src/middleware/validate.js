/**
 * Validates req.body / req.query / req.params with Zod schemas.
 * Parsed (coerced, defaulted) values are placed on req.validated; ZodErrors go to errorHandler.
 */
export const validate = (schemas) => (req, res, next) => {
  try {
    req.validated = {
      body: schemas.body ? schemas.body.parse(req.body) : req.body,
      query: schemas.query ? schemas.query.parse(req.query) : req.query,
      params: schemas.params ? schemas.params.parse(req.params) : req.params,
    };
    next();
  } catch (err) {
    next(err);
  }
};

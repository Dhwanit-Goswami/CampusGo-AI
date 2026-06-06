const { body, validationResult } = require("express-validator");

const validateRules = (validations) => {
  return async (req, res, next) => {
    for (let validation of validations) {
      await validation.run(req);
    }

    const errors = validationResult(req);
    if (errors.isEmpty()) {
      return next();
    }

    res.status(400).json({ errors: errors.array() });
  };
};

const registerValidation = validateRules([
  body("name").trim().notEmpty().withMessage("Name is required"),
  body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").isLength({ min: 8 }).withMessage("Password must be at least 8 characters long")
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^])[A-Za-z\d@$!%*?&#^]{8,}$/)
    .withMessage("Password does not meet complexity requirements"),
  body("gender").trim().notEmpty().withMessage("Gender is required"),
]);

const loginValidation = validateRules([
  body("email").trim().isEmail().withMessage("Valid email is required").normalizeEmail(),
  body("password").notEmpty().withMessage("Password is required"),
]);

const profileUpdateValidation = validateRules([
  body("gender").trim().notEmpty().withMessage("Gender is required"),
]);

module.exports = { registerValidation, loginValidation, profileUpdateValidation };

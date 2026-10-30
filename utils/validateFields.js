export const validateFields = (values, rules) => {
    const errors = {};
    for (const field in rules) {
        const value = values[field];
        const rule = rules[field];
        if (rule.required && (!value || value.toString().trim() === "")) {
            errors[field] = rule.requiredMessage || `${field} is required`;
        }
        if (rule.regex && value && !rule.regex.test(value)) {
            errors[field] = rule.regexMessage || `${field} is invalid`;
        }
    }
    return errors;
};

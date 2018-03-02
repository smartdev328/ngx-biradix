module.exports = {
    "extends": "google",
    "rules": {
        "linebreak-style": ["error", "windows"],
        "quotes": ["error", "double"],
        "max-len" : ["error", { "code": 160 }],
        "no-multiple-empty-lines": ["error", { "max": 1, "maxEOF": 1 }]
    },
    "parserOptions": {
        "ecmaVersion": 6
    }
};
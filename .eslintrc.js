module.exports = {
    "extends": "google",
    "rules": {
        "linebreak-style": ["error", "windows"],
        "quotes": ["error", "double"],
        "max-len" : ["error", { "code": 320 }],
        "no-multiple-empty-lines": ["error", { "max": 1, "maxEOF": 1 }],
        "no-trailing-spaces": [0],
        "guard-for-in": [1]
    },
    "parserOptions": {
        "ecmaVersion": 6
    }
};
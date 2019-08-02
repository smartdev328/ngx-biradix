const path = require('path');
const fs = require('fs');

class WriteFullHashPlugin {
  apply(compiler) {
    compiler.hooks.done.tap('WriteFullHashPlugin', (
      stats /* stats is passed as argument when done hook is tapped.  */
    ) => {
      try {
        fs.writeFileSync(path.join(__dirname, "../dist/biradix-platform", "hash.json"), JSON.stringify(stats.toJson().hash));
      } catch (err) {
        console.error(err);
      }
    });
  }
}

module.exports = {
  plugins: [new WriteFullHashPlugin({ options: true })]
};

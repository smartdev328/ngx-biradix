var path = require('path');

module.exports = {
  plugins: [
    // This plugin creates an overall hash signature of the code. We are checking against it on a timer to see if it changed. If changed, we refresh the page.
    function() {
      this.plugin("done", function(stats) {
        require("fs").writeFileSync(
          path.join(__dirname, "../dist/biradix-platform", "hash.json"),
          JSON.stringify(stats.toJson().hash));
      });
    }
  ]
};

async function writeEslintRules(){
    var ruleObject = {}
    const allEslintRules = require('all-eslint-rules');
    const rules = Array.from(allEslintRules())
    rules.forEach(rule => {
      ruleObject[rule] = 0
    })
    jetpack.write("rules.json", ruleObject)
}

gulp.task("write-eslint-rules", writeEslintRules)
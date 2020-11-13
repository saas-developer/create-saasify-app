const { Command } = require('commander');
const envinfo = require('envinfo');
const chalk = require('chalk');

let projectName;
function init() {
  const program = new Command();
  program.version('0.0.1');
  program
  .option('-d, --debug', 'output extra debugging')
  .option('-p, --pizza-type <type>', 'flavour of pizza')
  .option('-i, --info', 'Print environment information')

  program
    .arguments('<project-directory>')
    .action(function (projectDirectory) {
      console.log('projectDirectory', projectDirectory);
      projectName = projectDirectory;
    });

  program.parse(process.argv);

  if (program.info) {
    console.log(chalk.bold('Printing additional environment information'));
    console.log(chalk.green(`\n Current version of program is ${program.version()}`))

    return envinfo.run(
      {
        System: ['OS', 'CPU'],
        Binaries: ['Node', 'Yarn', 'npm'],
        Browsers: ['Chrome', 'Firefox', 'Safari', 'Edge', 'Internet Explorer'],
        npmPackages: ['react'],
        npmGlobalPackages: ['create-saasify-app']
      }
    ).then(console.log)
  }
}

// module.exports = {
//   init
// }

init();
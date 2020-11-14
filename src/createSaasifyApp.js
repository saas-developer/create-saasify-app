const { Command } = require('commander');
const envinfo = require('envinfo');
const chalk = require('chalk');
const semver = require('semver');
const path = require('path');
const fs = require('fs-extra');

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

  const isNodeVersionValid = verifyNodeVersion();
  if (!isNodeVersionValid) {
    return;
  }

  createSaasifyApp();
}

function verifyNodeVersion() {
  console.log('process.version', process.version);

  const isNodeVersionGreaterThan10 = semver.satisfies(process.version, '>=10');
  console.log('isNodeVersionGreaterThan10', isNodeVersionGreaterThan10);
  if (!isNodeVersionGreaterThan10) {
    console.log(chalk.red(`You are using Node version ${process.version} which is unsupported`));
    console.log(chalk.red(`Please upgrade to atleast version 10`));
    return false;
  }
  return true;

}

function createSaasifyApp() {
  // Create project directory
  const root = path.resolve(projectName);
  fs.ensureDirSync(root);

  


}

// module.exports = {
//   init
// }

init();
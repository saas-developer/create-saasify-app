const { Command } = require('commander');
const envinfo = require('envinfo');
const chalk = require('chalk');
const semver = require('semver');
const path = require('path');
const fs = require('fs-extra');
const os = require('os');
const spawn = require('cross-spawn');

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
  const isNodeVersionGreaterThan10 = semver.satisfies(process.version, '>=10');

  if (!isNodeVersionGreaterThan10) {
    console.log(chalk.red(`You are using Node version ${process.version} which is unsupported`));
    console.log(chalk.red(`Please upgrade to atleast version 10`));
    return false;
  }
  return true;

}

function createSaasifyApp() {
  console.log('projectName is', projectName);

  // Create project directory
  const root = path.resolve(projectName);
  console.log('root', root);

  const appName = path.basename(root);
  console.log('appName', appName);

  fs.ensureDirSync(root);

  const packageJson = {
    name: appName,
    version: '0.2.0',
    private: true
  };

  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(packageJson, null, 2) + os.EOL
  );

  // current dir
  const originalDirectory = process.cwd();
  process.chdir(root);

  // Install our template
  const packageName = 'file:../saasify-template-bronze/saasify-template-bronze-1.0.0.tgz';
  const packagePath = packageName.split('file:')[1];

  const packageToInstall = `file:${path.resolve(originalDirectory, packagePath)}`;
  console.log('packageToInstall', packageToInstall);

  installPackage(root, packageToInstall)
}

function installPackage(cwd, package) {
  return new Promise((resolve, reject) => {
    let command = 'npm';
    let args = ['install' ,'--save', '--save-exact', package];

    console.log('args', args);

    const child = spawn(command, args, { stdio: 'inherit' });
    child.on('close', code => {
      if (code != 0) {
        reject();
      } else {
        resolve();
      }
    })

  })
};

// module.exports = {
//   init
// }

init();
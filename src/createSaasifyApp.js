const { Command } = require('commander');
const envinfo = require('envinfo');
const chalk = require('chalk');
const semver = require('semver');
const path = require('path');
const fs = require('fs-extra');
const spawn = require('cross-spawn');
const os = require('os');

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
  // Step 1: Create project directory
  const root = path.resolve(projectName);
  fs.ensureDirSync(root);

  const appName = path.basename(root);

  const currentDirectory = process.cwd();
  process.chdir(root);

  // Step 2: Create a basic package.json file
  const packageJson = {
    name: appName,
    private: true
  }

  fs.writeFileSync(
    path.join(root, 'package.json'),
    JSON.stringify(packageJson, null, 2) + os.EOL
  )


  // Step 3: Install the template npm package
  const templatePackageName = 'file:../saasify-template-bronze/saasify-template-bronze-1.0.0.tgz';
  const templatePackagePath = templatePackageName.split('file:')[1];
  const fullPathToTemplate = path.resolve(currentDirectory, templatePackagePath);
  console.log('fullPathToTemplate', fullPathToTemplate);
  const templatePackageToInstall = `file:${fullPathToTemplate}`;
  const status = installPackage(templatePackageToInstall);
  if (status != 0) {
    // Error
    console.log('An error occurred during template install');
  }

  const saasifyScriptsPackageName = 'file:../saasify-scripts/saasify-scripts-1.0.0.tgz';
  const saasifyScriptsPackagePath = saasifyScriptsPackageName.split('file:')[1];
  const fullPathToSaasifyScripts = path.resolve(currentDirectory, saasifyScriptsPackagePath);
  console.log('fullPathToSaasifyScripts', fullPathToSaasifyScripts);
  const saasifyScriptsPackageToInstall = `file:${fullPathToSaasifyScripts}`;
  const status2 = installPackage(saasifyScriptsPackageToInstall);
  if (status2 != 0) {
    // Error
    console.log('An error occurred during saasify-scripts install');
  }

  // Call saasify-scripts/scripts/init.js to do the remaining steps

  const source = `
    var { init } = require('saasify-scripts/scripts/init.js');
    init.apply(null, JSON.parse(process.argv[1]))
  `;

  executeNode({
    cwd: process.cwd(),
    args: []
  },
  [root, appName],
  source
  )
  return;


  


}

function executeNode({ cwd, args }, data, source) {
  console.log('process.execPath', process.execPath);
  const proc = spawn.sync(
    process.execPath,
    [...args, '-e', source, '--', JSON.stringify(data)],
    { cwd, stdio: 'inherit' }
  );

  return proc.status;
}

function runNpmInstall(directory) {
  const result = spawn.sync('npm', ['install', '--save'], { stdio: 'inherit', cwd: directory });
  
  return result.status;
}

function installPackage(templatePackageToInstall) {
  const result = spawn.sync('npm', ['install', '--save', '--save-exact', templatePackageToInstall], { stdio: 'inherit' });
  
  return result.status;
}

// module.exports = {
//   init
// }

init();
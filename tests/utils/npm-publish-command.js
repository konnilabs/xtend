'use strict';

function isRootPublishCommand(line) {
  const [tool, command, ...args] = line.trim().replace(/^run:\s+/u, '').split(/\s+/u);
  return tool === 'npm' && command === 'publish' && args.length === 5
    && args.includes('--provenance')
    && [['--tag', 'latest'], ['--access', 'public']].every(([option, value]) => {
      const index = args.indexOf(option);
      return index >= 0 && args[index + 1] === value;
    });
}

function assertNpmPublishCommand(context, workflow) {
  const options = ['--tag latest', '--provenance', '--access public'];
  options.forEach((first) => {
    options.filter((option) => option !== first).forEach((second) => {
      const third = options.find((option) => option !== first && option !== second);
      const command = `npm publish ${first} ${second} ${third}`;
      context.assert(isRootPublishCommand(command) && isRootPublishCommand(`        run: ${command}`),
        `Publish command accepts equivalent option order: ${first} ${second} ${third}`);
    });
  });
  const command = 'npm publish --access public --provenance --tag latest';
  [
    `${command} --dry-run`,
    `${command} --workspace @ccslabs/xtend-rmt`,
    `# ${command}`,
    `echo ${command}`,
    command.replace('--provenance ', ''),
    command.replace('--provenance', '--provenance=false'),
    command.replace('--tag latest', '--tag next'),
    command.replace('--access public', '--access restricted')
  ].forEach((invalid) => {
    context.assert(!isRootPublishCommand(invalid), `Publish command rejects: ${invalid}`);
  });
  const job = (workflow.split('\n  npm-publish-latest:\n')[1] || '').split(/\n  [a-z][\w-]*:\n/u)[0];
  context.assert(job.split('\n').some(isRootPublishCommand), 'CI workflow publishes latest with npm provenance');
}

module.exports = { assertNpmPublishCommand };

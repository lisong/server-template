import { Command, CommandRunner, Option } from 'nest-commander';

@Command({ name: 'users', description: 'User related commands' })
export class UsersCommand extends CommandRunner {
  async run(
    passedParam: string[],
    options?: Record<string, any>,
  ): Promise<void> {
    console.log('User command executed', passedParam, options);
  }

  @Option({
    flags: '-n, --name [name]',
    description: 'User name',
  })
  parseName(val: string): string {
    return val;
  }
}

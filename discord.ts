import "process"
import { Client } from 'discord.js'
import { parser } from './parse'
import { Zipper, Result, ok, bad, zip, ZipperMove, 
         left, right, up, down, set, printZipper } from './edit'

const PREFIX = "e!"

const client = new Client();
interface UserState { [key: string]: Zipper }

type Command = (user: string, arg: string, state: UserState) => Result<[UserState, string]>

interface Commands { 
  [key:string]: Command
}

const edit: Command = (user, arg, state) => {
  const result = parser.list.parse(arg);
  if (result.status) {
    const { value } = result;

    const zipper = zip(value);

    return ok([{
      ...state,
      [user]: zipper
    }, printZipper(zipper)]);
  } else {
    return bad(`Failed to parse: ${result.expected}`)
  }
}

const mustBeEditing = (command: (zipper: Zipper) => Command): Command => (user, arg, state) => {
  const zipper = state[user];
  if(!zipper) return bad("not editing anything")
  return command(zipper)(user, arg, state)
}

const moveCommand = (move: ZipperMove) => mustBeEditing(zipper => (user, arg, state) => {
  const result = move(zipper);

  if (result.kind === "bad") return result;

  return ok([{
    ...state,
    [user]: result.result
  }, printZipper(result.result)])
})

const leftCommand = moveCommand(left);
const rightCommand = moveCommand(right);
const upCommand = moveCommand(up);
const downCommand = moveCommand(down);

const setCommand: Command = mustBeEditing(zipper => (user, arg, state) => {
  const result = parser.expr.parse(arg);
  if (!result.status) {
    return bad(`Failed to parse: ${result.expected}`)
  }
  const newZ = set(zipper, result.value);
  return ok([{
    ...state,
    [user]: newZ
  }, printZipper(newZ)]);
});

const print: Command = mustBeEditing(zipper => (_user, _arg, state) => {
  return ok([state, printZipper(zipper)])
})

const commands: Commands = { 
  edit, 
  left: leftCommand, 
  right: rightCommand,
  up: upCommand,
  down: downCommand,
  set: setCommand,
  print
}

const messageHandler: Command = (user, arg, state) => {
    let commandEnd = arg.indexOf(" ");
    commandEnd = commandEnd === -1 ? arg.length : commandEnd;
    const commandStr = arg.substring(0, commandEnd);
    const command = commands[commandStr];
    return command 
      ? command(user, arg.substring(commandEnd + 1), state) 
      : bad(`not a command: ${commandStr}`)
}

const main = async () => {

  let state: UserState = {}

  client.on('message', async message => {

    const { author, content } = message;

    if (content.startsWith(PREFIX)) {
      const result = messageHandler(author.id, content.substring(PREFIX.length), state);
      if (result.kind === "bad") {
        await message.reply(`error: ${result.message}`);
      } else {
        const [newState, response] = result.result;
        state = newState;
        await message.reply(response);
      }
    }
  });
  
  await client.login(process.env.BOT_KEY);
  console.log("logged in")
}

main();

/*const parsed = parser.list.parse("((asdf b c) schleger ojierg)")
if (parsed.status) {
  const zipped = zip(parsed.value);
  const result = down(zipped);
  if (result.kind === "ok") {
    const parsed2 = parser.expr.parse("(a b c)");
    if (parsed2.status) {
      const result2 = set(result.result, parsed2.value)
      console.log(printZipper(result2));
    }
  }
}*/
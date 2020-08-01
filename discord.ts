require("dotenv").config();
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

    return ok([{
      ...state,
      [user]: zip(value)
    }, "ok"]);
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
  }, "ok"])
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
  return ok([{
    [user]: set(zipper, result.value),
    ...state
  }, "ok"]);
});

const commands: Commands = { edit, left: leftCommand }

const messageHandler: Command = (user, arg, state) => {
    const commandEnd = arg.indexOf(" ");
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

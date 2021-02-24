import { Context } from './entry';

export class Model {
  public async sendEvents(context: Context, { xAPIEvents }: any) {
    console.log('sendEvents');
    return true;
  }
}

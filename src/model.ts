export class Model {
  public async sendEvents({ xAPIEvents }: any) {
    console.log('sendEvents received: ', xAPIEvents);
    return true;
  }
}
